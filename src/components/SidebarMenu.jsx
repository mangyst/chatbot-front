import React, { useState, useEffect } from 'react';
import { Menu, Dropdown, Button } from 'antd';
import { EllipsisOutlined } from '@ant-design/icons';
import { createPortal } from 'react-dom';
import { apiRequest } from '../api';
import '../index.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const OverlayConfirm = ({ open, onConfirm, onCancel }) => {
  if (!open) return null;

  const overlay = (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 20000,
        padding: 16,
      }}
      onClick={onCancel}
    >
      <div
        className="overlay-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="title">Delete chat?</div>
        <div className="buttons">
          <button autoFocus onClick={onCancel} className="overlay-btn">
            Cancel
          </button>
          <button onClick={onConfirm} className="overlay-btn delete">
            Delete
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(overlay, document.body);
};

const SidebarMenu = ({ user, onSelectDialog }) => {
  const [dialogs, setDialogs] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [counter, setCounter] = useState(1);
  const [selectedKey, setSelectedKey] = useState(null);
  const [editingKey, setEditingKey] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [isValidName, setIsValidName] = useState(true);
  const [focusedKey, setFocusedKey] = useState(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTargetKey, setConfirmTargetKey] = useState(null);

  const fetchDialogs = async () => {
    try {
      const data = await apiRequest(`${API_BASE_URL}/dialogs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (data.server === 'ok') {
        setDialogs(data.dialogs || []);
      }
    } catch {}
  };

  useEffect(() => {
    fetchDialogs();
  }, []);

  useEffect(() => {
    const items = dialogs.map(dialog => ({
      key: String(dialog.dialog_id),
      label: dialog.dialog_name || 'Unnamed dialog',
    }));
    setMenuItems(items);
    setCounter(items.length + 1);
    if (selectedKey && !items.find(item => item.key === selectedKey)) {
      setSelectedKey(null);
    }
  }, [dialogs]);

  useEffect(() => {
    if (dialogs.length === 0) {
      setSelectedKey(null);
      onSelectDialog?.(null);
      return;
    }
    if (!selectedKey || !dialogs.find(d => String(d.dialog_id) === selectedKey)) {
      const lastDialog = dialogs[dialogs.length - 1];
      const newKey = String(lastDialog.dialog_id);
      setSelectedKey(newKey);
      onSelectDialog?.(Number(newKey));
    }
  }, [dialogs]);

  useEffect(() => {
    if (!confirmOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setConfirmOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [confirmOpen]);

  const handleMenuClick = (e) => {
    if (editingKey) return;
    setSelectedKey(e.key);
    onSelectDialog?.(Number(e.key));
  };

  const handleCreateChatClick = () => {
    if (menuItems.length >= 5) return;
    const newKey = `new_${counter}`;
    setMenuItems(prev => [...prev, { key: newKey, label: 'New_chat' }]);
    setCounter(prev => prev + 1);
    setEditingKey(newKey);
    setEditingName('New_chat');
    setSelectedKey(newKey);
  };

  const handleDelete = async (key) => {
    if (isNaN(Number(key))) return;
    try {
      const data = await apiRequest(`${API_BASE_URL}/dialogs/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dialog_id: Number(key) }),
      });
      if (data.server === 'ok') {
        setDialogs(prev => prev.filter(d => String(d.dialog_id) !== key));
        if (selectedKey === key) {
          setSelectedKey(null);
          onSelectDialog?.(null);
        }
      }
    } catch {}
  };

  const openConfirm = (key) => {
    setConfirmTargetKey(key);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    const k = confirmTargetKey;
    setConfirmOpen(false);
    setConfirmTargetKey(null);
    await handleDelete(k);
  };

  const handleRename = (key, label) => {
    setEditingKey(key);
    setEditingName(label);
    setIsValidName(true);
  };

  const handleNameChange = (e) => {
    const value = e.target.value;
    setEditingName(value);
    setIsValidName(value.trim().length >= 3 && value.trim().length <= 20);
  };

  const finishEditing = async () => {
    const name = editingName.trim();
    if (!isValidName || name === '') {
      setEditingKey(null);
      setEditingName('');
      return;
    }

    if (String(editingKey).startsWith('new_')) {
      try {
        const data = await apiRequest(`${API_BASE_URL}/dialogs/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dialog_name: name }),
        });
        if (data.server === 'ok') {
          await fetchDialogs();
        }
      } catch {}
      finally {
        setEditingKey(null);
        setEditingName('');
      }
    } else {
      try {
        const data = await apiRequest(`${API_BASE_URL}/dialogs/rename`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dialog_id: Number(editingKey), dialog_name: name }),
        });
        if (data.server === 'ok') {
          setDialogs(prev =>
            prev.map(d =>
              String(d.dialog_id) === String(editingKey) ? { ...d, dialog_name: name } : d
            )
          );
        }
      } catch {}
      finally {
        setEditingKey(null);
        setEditingName('');
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') finishEditing();
    else if (e.key === 'Escape') {
      setEditingKey(null);
      setEditingName('');
    }
  };

  const handleFocus = (key) => setFocusedKey(key);
  const handleBlur = () => setFocusedKey(null);

  return (
    <div className="menu-container">
      <OverlayConfirm
        open={confirmOpen}
        onConfirm={confirmDelete}
        onCancel={() => setConfirmOpen(false)}
      />

      <button
        className="create-chat-btn-as-option"
        onClick={handleCreateChatClick}
        disabled={menuItems.length >= 5}
      >
        Create Chat
      </button>

      <Menu
        onClick={handleMenuClick}
        selectedKeys={selectedKey ? [selectedKey] : []}
        mode="inline"
        className="custom-menu"
        items={menuItems.map(item => ({
          key: item.key,
          label: editingKey === item.key ? (
            <input
              className={`menu-inline-input ${!isValidName ? 'invalid' : ''}`}
              value={editingName}
              onChange={handleNameChange}
              onBlur={finishEditing}
              onKeyDown={handleKeyDown}
              autoFocus
              maxLength={20}
              spellCheck={false}
            />
          ) : (
            <div
              className="menu-item-label"
              tabIndex={0}
              onFocus={() => handleFocus(item.key)}
              onBlur={handleBlur}
            >
              <span onDoubleClick={() => handleRename(item.key, item.label)}>
                {item.label}
              </span>
              <Dropdown
                overlay={
                  <Menu>
                    <Menu.Item key="Rename" onClick={() => handleRename(item.key, item.label)}>
                      Rename
                    </Menu.Item>
                    <Menu.Item key="Delete" onClick={() => openConfirm(item.key)}>
                      Delete
                    </Menu.Item>
                  </Menu>
                }
                trigger={['click']}
                placement="bottomRight"
              >
                <Button
                  type="text"
                  icon={<EllipsisOutlined />}
                  className={`menu-item-ellipsis ${focusedKey === item.key ? 'focused' : ''}`}
                  onClick={(e) => e.stopPropagation()}
                  tabIndex={-1}
                />
              </Dropdown>
            </div>
          ),
        }))}
      />
    </div>
  );
};

export default SidebarMenu;
