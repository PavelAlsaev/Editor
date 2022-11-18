import { io } from "socket.io-client";
import "codemirror/lib/codemirror.css";
import "codemirror/theme/material-ocean.css";
import "codemirror/mode/javascript/javascript";
import "codemirror/keymap/sublime";
import CodeMirror from "codemirror";
import "./styles/style.css";

console.log("hello world :)");

const inputUserName = document.getElementById("input-name-user");
const inputIdRoom = document.getElementById("input-id-room");
const buttonInter = document.getElementById("inter-button");
const toastInvalid = document.getElementById("toast-input-invalit");
const loginForm = document.getElementById("login-html");
const editorForm = document.getElementById("editor-html");
const exitButton = document.getElementById("exit");
const formFile = document.getElementById("formFile");
const saveFile = document.getElementById("saveFile");
const roomText = document.getElementById("id-room-text");
const countUserText = document.getElementById("count-user-text");
let cursor = null;

const editor = CodeMirror.fromTextArea(document.getElementById("ds"), {
  lineNumbers: true,
  mode: "javascript",
});

const toast = new bootstrap.Toast(toastInvalid);

buttonInter.addEventListener("click", (e) => {
  const userName = inputUserName.value;
  if (!userName.trim()) {
    toast.show();
    return;
  }
  const userRoom = inputIdRoom.value;
  if (!userRoom.trim()) {
    toast.show();
    return;
  }

  loginForm.classList.add("d-none");
  editorForm.classList.remove("d-none");

  socket = io("wss://92.63.101.204", {
    transports: ["websocket"],
  });

  socket.on("connect", () => {
    roomText.innerText = userRoom;
    socket.emit("CONNECTED_TO_ROOM", {
      roomId: userRoom,
      userName,
      code: editor.getValue(),
    });
  });

  socket.on("ROOM:CONNECTION", (users) => {
    countUserText.innerText = users.length;
  });

  socket.on("DISSCONNECT_FROM_ROOM", (users) => {
    countUserText.innerText = users.length;
  });

  socket.on("disconnect", () => {
    socket.emit("DISSCONNECT_FROM_ROOM", { roomId: userRoom, username: userName });
  });

  socket.on("START", ({ code, users }) => {
    if (!code) return;
    editor.setValue(code);
    countUserText.innerText = users.length;
  });

  socket.on("CODE_CHANGED", ({ code }) => {
    if (!code) return;
    editor.setValue(code);
    if (cursor) {
      editor.setCursor(cursor)
    }
  });

  editor.on("change", (instance, changes) => {
    cursor = editor.getCursor()
    const { origin } = changes;
    if (origin !== "setValue") {
      socket.emit("CODE_CHANGED", {
        value: instance.getValue(),
        roomId: userRoom,
      });
    }
  });
});

exitButton.addEventListener("click", (e) => {
  editor.setValue('');
  socket.emit("DISSCONNECT_FROM_ROOM", {
    roomId: inputIdRoom.value,
    username: inputUserName.value,
  });
  socket.close()
  editorForm.classList.add("d-none");
  loginForm.classList.remove("d-none");
  
});

formFile.addEventListener("change", (e) => {
  const input = e.target;
  const reader = new FileReader();
  const userRoom = inputIdRoom.value;
  reader.onload = () => {
    editor.setValue(reader.result);
    socket.emit("CODE_CHANGED", { value: reader.result, roomId: userRoom });
  };
  reader.readAsText(input.files[0]);
});

saveFile.addEventListener("click", (e) => {
  console.log(editor.getValue());
  var link = document.createElement("a");
  link.download = "data.js";
  var blob = new Blob([editor.getValue()], { type: "text/plain" });
  link.href = window.URL.createObjectURL(blob);
  link.click();
});
