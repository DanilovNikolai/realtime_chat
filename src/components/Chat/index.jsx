import React, { useContext, useState, useEffect, useRef } from "react";
// context
import { Context } from "../../index";
// firebase
import firebase from "firebase/compat/app";
import { useAuthState } from "react-firebase-hooks/auth";
import { useCollectionData } from "react-firebase-hooks/firestore";
// components
import Loader from "../Loader";
import Message from "../Message";
// styles
import styles from "./Chat.module.scss";
// icons
import sendIcon from "../../assets/icons/send_message.svg";
// utils
import formatTimestamp from "../../utils/formatTimestamp";

function Chat() {
  const { auth, firestore } = useContext(Context);
  const [user] = useAuthState(auth);
  const [value, setValue] = useState("");
  const [messages, loading] = useCollectionData(
    firestore.collection("messages").orderBy("createdAt")
  );
  const messagesEndRef = useRef(null);
  const [quotedMessage, setQuotedMessage] = useState(null);

  const handleLongPress = (messageText) => {
    // Код для обработки долгого нажатия
    // Копирование сообщения в localStorage
    localStorage.setItem("copiedMessage", messageText);
    setQuotedMessage(messageText);
  };

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!value.trim()) {
      return;
    }

    if (value.length > 200) {
      alert("Максимальная длина сообщения - 200 символов");
      return;
    }

    firestore.collection("messages").add({
      uid: user.uid,
      displayName: user.displayName,
      photoURL: user.photoURL,
      text: value,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
    setValue("");
    setQuotedMessage(null);
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <div className={styles.container}>
      <div className={styles.messagesContainer}>
        {messages?.map((message, index) => (
          <React.Fragment key={message.createdAt}>
            {(index === 0 ||
              (index > 0 &&
                formatTimestamp(message.createdAt).date !==
                  formatTimestamp(messages[index - 1].createdAt).date)) && (
              <div className={styles.dateDivider}>
                {formatTimestamp(message.createdAt).date}
              </div>
            )}
            <Message
              message={message}
              user={user}
              time={formatTimestamp(message.createdAt).time}
              onLongPress={() => handleLongPress(message.text)}
            />
          </React.Fragment>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className={styles.inputContainer}>
        <input
          className={styles.inputMessage}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={quotedMessage ? `Replying to: ${quotedMessage}` : ""}
        />
        {window.innerWidth <= 500 ? (
          <img
            src={sendIcon}
            alt="icon"
            style={{ width: "30px", paddingRight: "10px" }}
            onClick={sendMessage}
          />
        ) : (
          <button className={styles.inputButton} onClick={sendMessage}>
            Отправить
          </button>
        )}
      </div>
    </div>
  );
}

export default Chat;