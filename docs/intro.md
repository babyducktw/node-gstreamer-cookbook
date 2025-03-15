---
sidebar_position: 1
---

# 前言

你已經是一個 Node.js 開發者，並且正在處理簡易的視訊、音訊流處理。
直接調用 FFmpeg 或 GStreamer 的 CLI 又無法滿足你的需求。

例如涉及到動態管道的構建、動態設置管道元素的屬性、動態切換管道元素、動態監聽管道事件等等。
這些需要以程式化的方式來處理，而不是靜態的命令行。

那麼也許這份文檔對你有幫助。

在這份文檔中，我將介紹如何在 Node.js 環境下使用 [node-gtk](https://github.com/romgrk/node-gtk) 透過 [GObject](https://docs.gtk.org/gobject/) 調用 [GStreamer](https://gstreamer.freedesktop.org/) 的 API。

## 也許你有更好的選擇

如果 FFmpeg 或 GStreamer CLI 能滿足你的需求，那麼我建議你直接使用它們，不用再透過 GObject 調用。
Simple is the best. 使用 node-gtk 來調用 GStreamer 的方案整題來說學習成本還是挺高的。

對於真正複雜的視訊、音訊流處理，你需要更多的控制權，也許你需要調用一些底層 API 或實做一些自定義的管道元素。
那麼我建議不要再透過 node-gtk 來處理這些問題，而是直接使用 GStreamer 的 C 或 Rust 處理。

如果你是一個 Python 開發者，請不要使用 node-gtk 來調用 GStreamer。
GStreamer 有一個官方 Python 的綁定，討論度更高文檔更全面。
這邊有一個 [GStreamer 綁定支援的程式語言列表](https://gstreamer.freedesktop.org/bindings/)。
