import React, { useState, useRef, useEffect } from 'react';
import { Input, Button } from 'antd';
import { SendOutlined } from '@ant-design/icons';
import { apiRequest } from '../api';
import { useErrorStore } from '../errorStore';
import '../index.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const { TextArea } = Input;

const ChatWindow = ({ dialogId }) => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const { setError, clearError } = useErrorStore();
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleScroll = () => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 50;
    setShowScrollButton(!nearBottom);
  };

  const fetchMessages = async () => {
    if (!dialogId) return;
    try {
      const data = await apiRequest(`${API_BASE_URL}/dialogs/${dialogId}`, {
        method: 'GET',
      });
      if (data.server === 'ok' && Array.isArray(data.dialogs)) {
        const mapped = data.dialogs.map(msg => ({
          sender: msg.role,
          text: msg.content,
        }));
        setMessages(mapped);
      } else {
        setMessages([]);
      }
    } catch (err) {
      setError('Error while loading messages');
      setMessages([]);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    if (!dialogId) return;

    let intervalId;

    const checkFlag = async () => {
      try {
        const data = await apiRequest(`${API_BASE_URL}/flag/${dialogId}`, {
          method: 'GET',
        });
        if (data.server === 'ok') {
          const isTyping = data.content === true;
          if (!isTyping) {
            setIsLoading(false);
            clearInterval(intervalId);
            fetchMessages();
          } else {
            setIsLoading(true);
          }
        }
      } catch {
        clearInterval(intervalId);
      }
    };

    fetchMessages();
    checkFlag();
    intervalId = setInterval(checkFlag, 3000);

    return () => clearInterval(intervalId);
  }, [dialogId]);

  const sendMessage = async () => {
    const trimmed = inputValue.trim();
    if (!trimmed || isLoading) return;

    setMessages(prev => [...prev, { sender: 'user', text: trimmed }]);
    setInputValue('');
    setIsLoading(true);
    clearError();

    try {
      const data = await apiRequest(`${API_BASE_URL}/send/message/ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dialog_id: dialogId,
          text_user: trimmed,
        }),
      });

      if (data.answer_ai) {
        let index = 0;
        const aiText = data.answer_ai;
        const interval = setInterval(() => {
          setMessages(prev => {
            const last = prev[prev.length - 1];
            if (last?.sender === 'bot' && last?.text) {
              prev[prev.length - 1] = { sender: 'bot', text: last.text + aiText[index] };
            } else {
              prev.push({ sender: 'bot', text: aiText[index] });
            }
            return [...prev];
          });
          index++;
          if (index >= aiText.length) clearInterval(interval);
        }, 30);
        setIsLoading(false);
      }
    } catch {
      setIsLoading(false);
      setError('Error while sending message');
    }
  };

  const handleKeyDown = e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-inner-wrapper">
        <div
          className="messages"
          ref={messagesContainerRef}
          onScroll={handleScroll}
        >
          {messages.map((msg, index) => (
            <div key={index} className={`message ${msg.sender}`}>
              <div className="message-content">{msg.text}</div>
            </div>
          ))}

          {isLoading && (
            <div className="message bot">
              <div className="message-content typing-indicator">
                AI печатает<span>.</span><span>.</span><span>.</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div
          className={`scroll-to-bottom ${showScrollButton ? 'visible' : ''}`}
          onClick={scrollToBottom}
        >
          <span className="arrow">↓</span>
        </div>

        <div className="input-area-wrapper">
          <div className="input-area">
            <TextArea
              className="chat-input"
              placeholder={isLoading ? "AI is generating a response.." : "Type your message..."}
              autoSize={{ minRows: 2, maxRows: 4 }}
              maxLength={2000}
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
            />
            {inputValue.trim() !== '' && !isLoading && (
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={sendMessage}
                className="send-button"
              />
            )}
            <div className="char-count">{inputValue.length} / 2000</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
