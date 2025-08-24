import React, { useState, useRef, useEffect } from 'react';
import { Input, Button } from 'antd';
import { SendOutlined } from '@ant-design/icons';
import { apiRequest } from '../api';
import { useErrorStore } from '../errorStore';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const { TextArea } = Input;

const ChatWindow = ({ dialogId }) => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [bottomOffset, setBottomOffset] = useState(80);
  const { setError, clearError } = useErrorStore();

  const chatInnerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const inputWrapperRef = useRef(null);
  const botMessageRef = useRef('');
  const intervalRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleScroll = () => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 50;
    setShowScrollButton(!nearBottom);
  };

  // загрузка сообщений
  const fetchMessages = async () => {
    if (!dialogId) return;
    try {
      const data = await apiRequest(`${API_BASE_URL}/dialogs/${dialogId}`, { method: 'GET' });
      if (data.server === 'ok' && Array.isArray(data.dialogs)) {
        const mapped = data.dialogs.map(msg => ({ sender: msg.role, text: msg.content }));
        setMessages(mapped);
      } else {
        setMessages([]);
      }
    } catch {
      setError('Error while loading messages');
      setMessages([]);
    }
  };

  useEffect(() => {
    if (!messagesContainerRef.current) return;
    const el = messagesContainerRef.current;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 50;
    if (isNearBottom) scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    if (!dialogId) return;
    const checkFlag = async () => {
      try {
        const data = await apiRequest(`${API_BASE_URL}/flag/${dialogId}`, { method: 'GET' });
        if (data.server === 'ok') {
          const isTyping = data.content === true;
          if (!isTyping) {
            setIsLoading(false);
            clearInterval(intervalRef.current);
            fetchMessages();
          } else {
            setIsLoading(true);
          }
        }
      } catch {
        clearInterval(intervalRef.current);
      }
    };
    fetchMessages();
    checkFlag();
    const flagInterval = setInterval(checkFlag, 3000);
    return () => clearInterval(flagInterval);
  }, [dialogId]);

  // рассчитываем bottom для стрелки: расстояние от низа chatInner до top(inupt) плюс запас
  useEffect(() => {
    const updateOffset = () => {
      if (!chatInnerRef.current || !inputWrapperRef.current) return;
      const chatRect = chatInnerRef.current.getBoundingClientRect();
      const inputRect = inputWrapperRef.current.getBoundingClientRect();
      const margin = 12; // дополнительный отступ между стрелкой и инпутом
      // bottom = distance from container bottom to input.top + margin
      const bottom = Math.max(8, Math.round(chatRect.bottom - inputRect.top + margin));
      setBottomOffset(bottom);
    };

    // Initial update
    updateOffset();

    // Update on window resize
    window.addEventListener('resize', updateOffset);

    // Watch changes in input size or chatInner size
    let ro;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => updateOffset());
      if (inputWrapperRef.current) ro.observe(inputWrapperRef.current);
      if (chatInnerRef.current) ro.observe(chatInnerRef.current);
    }

    return () => {
      window.removeEventListener('resize', updateOffset);
      if (ro) ro.disconnect();
    };
  }, [inputValue]); // пересчитываем при изменении inputValue (высота инпута может измениться)

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
        body: JSON.stringify({ dialog_id: dialogId, text_user: trimmed }),
      });

      if (data.answer_ai) {
        const aiText = data.answer_ai;
        botMessageRef.current = '';

        setMessages(prev => [...prev, { sender: 'bot', text: '' }]);

        let index = 0;
        intervalRef.current = setInterval(() => {
          botMessageRef.current += aiText[index] || '';
          setMessages(prev => {
            const last = prev[prev.length - 1];
            if (last && last.sender === 'bot') {
              return [...prev.slice(0, -1), { sender: 'bot', text: botMessageRef.current }];
            }
            return prev;
          });
          index++;
          if (index >= aiText.length) {
            clearInterval(intervalRef.current);
            setIsLoading(false);
          }
        }, 30);
      } else {
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
      <div className="chat-inner-wrapper" ref={chatInnerRef}>
        <div className="messages" ref={messagesContainerRef} onScroll={handleScroll}>
          {messages.map((msg, index) => (
            <div key={index} className={`message ${msg.sender}`}>
              <div className="message-content">{msg.text}</div>
            </div>
          ))}

          {isLoading && messages[messages.length - 1]?.sender !== 'bot' && (
            <div className="message bot">
              <div className="message-content typing-indicator">
                AI is thinking<span>.</span><span>.</span><span>.</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Стрелка — позиция задаётся inline bottom (px) */}
        <div
          className={`scroll-to-bottom ${showScrollButton ? 'visible' : ''}`}
          onClick={scrollToBottom}
          aria-label="Scroll to bottom"
          style={{ bottom: `${bottomOffset}px` }}
        >
          <span className="arrow">↓</span>
        </div>

        <div className="input-area-wrapper" ref={inputWrapperRef}>
          <div className="input-area">
            <TextArea
              className="chat-input"
              placeholder={isLoading ? "AI is thinking..." : "Type your message..."}
              autoSize={{ minRows: 2, maxRows: 6 }}
              maxLength={2000}
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
            />
            {inputValue.trim() !== '' && !isLoading && (
              <Button type="primary" icon={<SendOutlined />} onClick={sendMessage} className="send-button" />
            )}
            <div className="char-count">{inputValue.length} / 2000</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
