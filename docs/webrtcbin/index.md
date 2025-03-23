---
sidebar_position: 1
---

# WebRTC

## 目標

想在 GStreamer 中處理 WebRTC 流媒體嗎？
有很多的範例可以參考。
https://gitlab.freedesktop.org/gstreamer/gstreamer/-/tree/main/subprojects/gst-examples/webrtc

本篇會示範用 node-gtk 來寫最基本建立兩個 WebRTC Client，一個作為發送，一個作為接收。

## WebRTCBin 發送與接收

官方範例 (C)：https://gitlab.freedesktop.org/gstreamer/gst-plugins-bad/-/blob/discontinued-for-monorepo/tests/examples/webrtc/webrtc.c

```typescript
import GObject from '@girs/node-gobject-2.0';
import Gst from '@girs/node-gst-1.0';
import GstSdp from '@girs/node-gstsdp-1.0';
import GstWebRTC from '@girs/node-gstwebrtc-1.0';

void (async () => {
  Gst.init(null);

  const pipeline = Gst.parseLaunch(`
    videotestsrc ! video/x-raw,framerate=1/1 ! queue ! vp8enc ! rtpvp8pay ! queue !
    application/x-rtp,media=video,payload=96,encoding-name=VP8 !
    webrtcbin name=send webrtcbin name=recv
  `) as Gst.Pipeline;

  const webrtc1 = pipeline.getByName('send');
  const webrtc2 = pipeline.getByName('recv');

  webrtc1.connect('on-negotiation-needed', () => {
    void (async () => {
      try {
        const offerText = await createOffer(webrtc1);
        await setLocalDescription(
          webrtc1,
          GstWebRTC.WebRTCSDPType.OFFER,
          offerText,
        );
        await setRemoteDescription(
          webrtc2,
          GstWebRTC.WebRTCSDPType.OFFER,
          offerText,
        );
        const answerText = await createAnswer(webrtc2);
        await setLocalDescription(
          webrtc2,
          GstWebRTC.WebRTCSDPType.ANSWER,
          answerText,
        );
        await setRemoteDescription(
          webrtc1,
          GstWebRTC.WebRTCSDPType.ANSWER,
          answerText,
        );
      } catch (error) {
        console.error(error);
      }
    })();
  });

  webrtc2.connect('pad-added', (newPad: Gst.Pad) => {
    if (newPad.getDirection() != Gst.PadDirection.SRC) {
      return;
    }

    const outBin = Gst.parseBinFromDescription(
      'rtpvp8depay ! vp8dec ! videoconvert ! queue ! xvimagesink sync=false',
      true,
    );

    pipeline.add(outBin);
    outBin.syncStateWithParent();

    newPad.link(outBin.getStaticPad('sink'));
  });

  webrtc1.connect(
    'on-ice-candidate',
    (sdpMLineIndex: number, candidate: string) => {
      void (async () => {
        try {
          await addIceCandidate(webrtc2, { sdpMLineIndex, candidate });
        } catch (error) {
          console.error(error);
        }
      });
    },
  );

  webrtc2.connect(
    'on-ice-candidate',
    (sdpMLineIndex: number, candidate: string) => {
      void (async () => {
        try {
          await addIceCandidate(webrtc1, { sdpMLineIndex, candidate });
        } catch (error) {
          console.error(error);
        }
      });
    },
  );

  console.log('Starting pipeline');
  pipeline.setState(Gst.State.PLAYING);

  const bus = pipeline.getBus();
  let terminate = false;
  do {
    await new Promise((resolve) => setImmediate(resolve));

    const msg = bus.timedPopFiltered(
      100 * Gst.MSECOND,
      Gst.MessageType.STATE_CHANGED |
      Gst.MessageType.ERROR |
      Gst.MessageType.EOS,
    );

    if (!msg) {
      continue;
    }

    switch (msg.type) {
      case Gst.MessageType.STATE_CHANGED:
        if (msg.src === pipeline) {
          const [oldState, newState] = msg.parseStateChanged();
          const oldStateName = Gst.Element.stateGetName(oldState);
          const newStateName = Gst.Element.stateGetName(newState);
          const dumpName = `state_changed-${oldStateName}_${newStateName}`;
          Gst.debugBinToDotFileWithTs(
            pipeline,
            Gst.DebugGraphDetails.ALL,
            dumpName,
          );
        }
        break;
      case Gst.MessageType.ERROR:
        Gst.debugBinToDotFileWithTs(
          pipeline,
          Gst.DebugGraphDetails.ALL,
          'error',
        );
        const [err, dbgInfo] = msg.parseError();
        console.error(
          `ERROR from element ${msg.src.getName()}: ${err.message}`,
        );
        console.error(`Debugging info: ${dbgInfo || 'none'}`);
        err.free();
        terminate = true;
        break;
      case Gst.MessageType.EOS:
        Gst.debugBinToDotFileWithTs(pipeline, Gst.DebugGraphDetails.ALL, 'eos');
        console.log('End-Of-Stream reached.');
        terminate = true;
        break;
      default:
        break;
    }
  } while (!terminate);

  pipeline.setState(Gst.State.NULL);
  console.log('Pipeline stopped');

  webrtc1.unref();
  webrtc2.unref();
  bus.unref();
  pipeline.unref();

  Gst.deinit();
})();

async function createOffer(webrtc: Gst.Element) {
  const promise = await new Promise<Gst.Promise>((resolve) => {
    webrtc.emit(
      'create-offer',
      Gst.Structure.newEmpty('NULL'),
      Gst.Promise.newWithChangeFunc((x) => resolve(x)),
    );
  });
  const reply = promise.getReply();
  const value: GObject.Value = reply.getValue('offer');
  const description = value.getBoxed<GstWebRTC.WebRTCSessionDescription>();
  console.log(`Created offer:\n${description.sdp.asText()}`);
  return description.sdp.asText();
}

async function createAnswer(webrtc: Gst.Element) {
  const promise = await new Promise<Gst.Promise>((resolve) => {
    webrtc.emit(
      'create-answer',
      Gst.Structure.newEmpty('NULL'),
      Gst.Promise.newWithChangeFunc((x) => resolve(x)),
    );
  });
  const reply = promise.getReply();
  const value: GObject.Value = reply.getValue('answer');
  const description = value.getBoxed<GstWebRTC.WebRTCSessionDescription>();
  console.log(`Created answer:\n${description.sdp.asText()}`);
  return description.sdp.asText();
}

async function setLocalDescription(
  webrtc: Gst.Element,
  type: GstWebRTC.WebRTCSDPType,
  sdpText: string,
) {
  const [, sdpMessage] = GstSdp.SDPMessage.newFromText(sdpText);
  const description = GstWebRTC.WebRTCSessionDescription.new(type, sdpMessage);
  await new Promise<Gst.Promise>((resolve) => {
    webrtc.emit(
      'set-local-description',
      description,
      Gst.Promise.newWithChangeFunc((x) => resolve(x)),
    );
  });
}

async function setRemoteDescription(
  webrtc: Gst.Element,
  type: GstWebRTC.WebRTCSDPType,
  sdpText: string,
) {
  const [, sdpMessage] = GstSdp.SDPMessage.newFromText(sdpText);
  const description = GstWebRTC.WebRTCSessionDescription.new(type, sdpMessage);
  await new Promise<Gst.Promise>((resolve) => {
    webrtc.emit(
      'set-remote-description',
      description,
      Gst.Promise.newWithChangeFunc((x) => resolve(x)),
    );
  });
}

async function addIceCandidate(
  webrtc: Gst.Element,
  candidateInit: RTCIceCandidateInit,
) {
  await new Promise<Gst.Promise>((resolve) => {
    webrtc.emit(
      'add-ice-candidate',
      candidateInit.sdpMLineIndex,
      candidateInit.candidate,
      Gst.Promise.newWithChangeFunc((x) => resolve(x)),
    );
  });
}
```

## 演練

### 管道

```typescript
const pipeline = Gst.parseLaunch(`
  videotestsrc ! video/x-raw,framerate=1/1 ! queue ! vp8enc ! rtpvp8pay ! queue !
  application/x-rtp,media=video,payload=96,encoding-name=VP8 !
  webrtcbin name=send webrtcbin name=recv
`) as Gst.Pipeline;
```

建立了兩個 WebRTC Client
- `videotestsrc ! video/x-raw,framerate=1/1 ! queue ! vp8enc ! rtpvp8pay ! queue !
  application/x-rtp,media=video,payload=96,encoding-name=VP8 !
  webrtcbin name=send` 作為發送
- `webrtcbin name=recv` 作為接收

### [on-negotiation-needed](https://gstreamer.freedesktop.org/documentation/webrtc/index.html#webrtcbin::on-negotiation-needed)

```typescript
webrtc1.connect('on-negotiation-needed', () => {
  void (async () => {
    try {
      const offerText = await createOffer(webrtc1);
      await setLocalDescription(
        webrtc1,
        GstWebRTC.WebRTCSDPType.OFFER,
        offerText,
      );
      await setRemoteDescription(
        webrtc2,
        GstWebRTC.WebRTCSDPType.OFFER,
        offerText,
      );
      const answerText = await createAnswer(webrtc2);
      await setLocalDescription(
        webrtc2,
        GstWebRTC.WebRTCSDPType.ANSWER,
        answerText,
      );
      await setRemoteDescription(
        webrtc1,
        GstWebRTC.WebRTCSDPType.ANSWER,
        answerText,
      );
    } catch (error) {
      console.error(error);
    }
  })();
});
```

當 WebRTC Client 需要協商時，會觸發 `on-negotiation-needed` 事件。
因為 WebRTC 是 P2P 的，所以可以由發送端發起協商，也可以由接收端發起協商。

當發起協商時，需要先建立 offer，將 offer 設定為 local description，再將 offer 傳送給對方。
對方收到 offer 後，將 offer 設定為 remote description，再建立 answer，將 answer 設定為 local description，然後把 answer 傳送給發送端。
發送端收到 answer 後，將 answer 設定為 remote description。這樣就完成了 sdp 協商。

範例中因為發送端和接收端都是同一個程式，所以可以直接在 `on-negotiation-needed` 事件中完成協商。
但在實際應用中，發送端和接收端是不同的程式，所以需要透過其他方式來傳送 offer 和 answer。

### [create-offer](https://gstreamer.freedesktop.org/documentation/webrtc/index.html#webrtcbin::create-offer)

```typescript
async function createOffer(webrtc: Gst.Element) {
  const promise = await new Promise<Gst.Promise>((resolve) => {
    webrtc.emit(
      'create-offer',
      Gst.Structure.newEmpty('NULL'),
      Gst.Promise.newWithChangeFunc((x) => resolve(x)),
    );
  });
  const reply = promise.getReply();
  const value: GObject.Value = reply.getValue('offer');
  const description = value.getBoxed<GstWebRTC.WebRTCSessionDescription>();
  console.log(`Created offer:\n${description.sdp.asText()}`);
  return description.sdp.asText();
}
```

建立 offer 的方法，透過 `create-offer` 事件來發起。
這是一個非同步的方法，第三個參數是 Gst.Promise，用來接收結果。
可以用一個 JavaScript Promise 來包裹這個方法，這樣就可以用 await 來等待結果。

Gst.Promise.getReply() 會回傳一個包含 offer 欄位的 Gst.Structure。
如果失敗，則會回傳一個包含 error 欄位的 Gst.Structure。

從 Gst.Structure 中取出某個欄位時會返回一個 GObject.Value，可以用 GObject.Value.getBoxed() 來取出真正的值。


### [set-local-description](https://gstreamer.freedesktop.org/documentation/webrtc/index.html#webrtcbin::set-local-description)

```typescript
async function setLocalDescription(
  webrtc: Gst.Element,
  type: GstWebRTC.WebRTCSDPType,
  sdpText: string,
) {
  const [, sdpMessage] = GstSdp.SDPMessage.newFromText(sdpText);
  const description = GstWebRTC.WebRTCSessionDescription.new(type, sdpMessage);
  await new Promise<Gst.Promise>((resolve) => {
    webrtc.emit(
      'set-local-description',
      description,
      Gst.Promise.newWithChangeFunc((x) => resolve(x)),
    );
  });
}
```

設定 local description 的方法，透過 `set-local-description` 事件來發起。

其中第二個參數是 WebRTCSessionDescription 物件，用來設定 sdp。

建立 WebRTCSessionDescription 物件時，需要指定 sdp 的類型，OFFER 或 ANSWER。

### 持續監聽事件

```typescript
  let terminate = false;
  do {
    await new Promise((resolve) => setImmediate(resolve));

    const msg = bus.timedPopFiltered(
      100 * Gst.MSECOND,
      Gst.MessageType.STATE_CHANGED |
      Gst.MessageType.ERROR |
      Gst.MessageType.EOS,
    );

    if (!msg) {
      continue;
    }

    switch (msg.type) {
      case Gst.MessageType.STATE_CHANGED:
        if (msg.src === pipeline) {
          const [oldState, newState] = msg.parseStateChanged();
          const oldStateName = Gst.Element.stateGetName(oldState);
          const newStateName = Gst.Element.stateGetName(newState);
          const dumpName = `state_changed-${oldStateName}_${newStateName}`;
          Gst.debugBinToDotFileWithTs(
            pipeline,
            Gst.DebugGraphDetails.ALL,
            dumpName,
          );
        }
        break;
      case Gst.MessageType.ERROR:
        Gst.debugBinToDotFileWithTs(
          pipeline,
          Gst.DebugGraphDetails.ALL,
          'error',
        );
        const [err, dbgInfo] = msg.parseError();
        console.error(
          `ERROR from element ${msg.src.getName()}: ${err.message}`,
        );
        console.error(`Debugging info: ${dbgInfo || 'none'}`);
        err.free();
        terminate = true;
        break;
      case Gst.MessageType.EOS:
        Gst.debugBinToDotFileWithTs(pipeline, Gst.DebugGraphDetails.ALL, 'eos');
        console.log('End-Of-Stream reached.');
        terminate = true;
        break;
      default:
        break;
    }
  } while (!terminate);
```

`GLib.MainLoop` 和 JavaScript 的事件循環不能很好的集成。

WebRTC 需要許多非同步操作，一旦 `GLib.MainLoop.run()` 開始運行時，JavaScript 的事件循環就會被阻塞，async 函數就無法執行。

所以這裡用了和[基本教學 4](https://gstreamer.freedesktop.org/documentation/tutorials/basic/time-management.html) 中一樣的方法：使用 while 迴圈來持續監聽事件。
這樣就可以在事件發生時執行相應的操作。

其中 `await new Promise((resolve) => setImmediate(resolve));` 是必要的，因為 `bus.timedPopFiltered()` 也是一個阻塞操作。

`await new Promise((resolve) => setImmediate(resolve));` 會讓後續的程式碼在下一個事件循環中執行。

`bus.timedPopFiltered()` 的第一個參數是超時時間，這裡設定為 100 毫秒。如果在 100 毫秒內沒有事件發生，則會返回 undefined，這時就可以繼續執行下一個迴圈。

這樣就解決了 GLib.MainLoop 和 JavaScript 的事件循環無法結合的問題。


