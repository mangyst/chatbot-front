import React, { useState, useEffect } from 'react';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { Layout, theme, ConfigProvider, Avatar, Typography, Spin, Drawer, Button } from 'antd';
import SidebarMenu from './components/SidebarMenu';
import ChatWindow from './components/ChatWindow';
import { apiRequest } from './api';
import { useErrorStore } from './errorStore';


const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const { Header, Content, Footer, Sider } = Layout;
const { Text } = Typography;

const siderStyle = {
  background: '#141414',
  height: '100vh',
  padding: 16,
  position: 'sticky',
  top: 0,
  insetInlineStart: 0,
  zIndex: 1000,
  overflow: 'hidden',
};

const App = () => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSpinner, setShowSpinner] = useState(true);
  const [selectedDialogId, setSelectedDialogId] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { error, clearError } = useErrorStore();

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const data = await apiRequest(`${API_BASE_URL}/me`, { method: 'GET' });
        const userData = data.content?.[0];
        if (userData) {
          const name = `${userData.given_name || ''} ${userData.family_name || ''}`.trim();
          setUser({
            name,
            picture: userData.picture || '',
            email: userData.email || '',
            id: userData.id,
          });
        }
      } catch {
        // Ошибка уже будет показана
      } finally {
        setIsLoading(false);
        setTimeout(() => setShowSpinner(false), 300);
      }
    };
    fetchSession();
  }, []);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        clearError();
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  const darkTheme = {
    algorithm: theme.darkAlgorithm,
    token: {
      colorPrimary: '#10b981',
      borderRadius: 8,
      colorBgBase: '#141414',
      colorTextBase: '#ffffff',
    },
    components: {
      Layout: {
        headerBg: '#1f1f1f',
        bodyBg: '#1f1f1f',
        footerBg: '#141414',
        siderBg: '#1f1f1f',
      },
    },
  };

  const handleLoginSuccess = async (credentialResponse) => {
    try {
      const token = credentialResponse.credential;
      const data = await apiRequest(`${API_BASE_URL}/create/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const name = `${data.given_name || ''} ${data.family_name || ''}`.trim();
      setUser({ name, picture: data.picture, email: data.email, id: data.id });
    } catch {
      // ошибка уже отображается
    }
  };

  const handleLoginError = () => {
    // Ошибка Google логина
  };

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <ConfigProvider theme={darkTheme}>
        {showSpinner && (
          <div className={`global-spinner ${!isLoading ? 'global-spinner-hidden' : ''}`}>
            <Spin size="large" tip="Loading..." style={{ color: '#fff' }} />
          </div>
        )}

        <Layout style={{ height: '100vh' }}>
          <Sider width={255} style={siderStyle}>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              {!user ? (
                <GoogleLogin
                  onSuccess={handleLoginSuccess}
                  onError={handleLoginError}
                  theme="outline"
                  size="medium"
                  shape="pill"
                  text="signin_with"
                />
              ) : (
                <>
                  <div
                    onClick={() => setDrawerOpen(true)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      cursor: 'pointer',
                      padding: '8px 12px',
                      borderRadius: 8,
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#2a2a2a')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <Avatar src={user.picture} size={40} />
                    <Text style={{ color: '#fff' }}>{user.name}</Text>
                  </div>

                  <Drawer
                    title="Profile"
                    placement="right"
                    onClose={() => setDrawerOpen(false)}
                    open={drawerOpen}
                    bodyStyle={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}
                  >
                    <Avatar src={user.picture} size={80} />
                    <Text strong style={{ fontSize: 18 }}>
                      {user.name}
                    </Text>
                    <Text type="secondary">{user.email}</Text>
                    <Button
                      danger
                      type="primary"
                      onClick={() => {
                        setUser(null);
                        setDrawerOpen(false);
                      }}
                    >
                      Log out
                    </Button>
                  </Drawer>
                </>
              )}
            </div>

            {user && (
              <div style={{ marginTop: 24 }}>
                <SidebarMenu user={user} onSelectDialog={setSelectedDialogId} />
              </div>
            )}
          </Sider>

          <Layout>
            <Header style={{ padding: 0, background: '#1f1f1f', height: 48, borderBottom: '1px solid #444' }} />

            <Content
              style={{
                position: 'relative',
                background: '#1f1f1f',
                color: '#ffffff',
                height: 'calc(100vh - 48px - 70px)',
                padding: 24,
                margin: '24px 16px 0',
                borderRadius: 8,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                textAlign: 'center',
                whiteSpace: 'pre-line',
              }}
            >
              {error && (
                <div
                  style={{
                    position: 'absolute',
                    top: -10,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: 'rgba(255, 77, 79, 0.95)',
                    color: '#fff',
                    padding: '10px 20px',
                    borderRadius: 6,
                    zIndex: 10000,
                    cursor: 'pointer',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.5)',
                    maxWidth: '90%',
                    userSelect: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                  onClick={clearError}
                  role="alert"
                  aria-live="assertive"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                    <polygon
                      points="12,2 22,20 2,20"
                      fill="none"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinejoin="round"
                    />
                    <text
                      x="12"
                      y="17"
                      textAnchor="middle"
                      fill="white"
                      fontSize="12"
                      fontWeight="bold"
                    >
                      !
                    </text>
                  </svg>
                  {error}
                </div>
              )}

              {!user ? (
                `Welcome!\n\nPlease log in with Google to continue.`
              ) : selectedDialogId ? (
                <div style={{ width: '100%' }}>
                  <ChatWindow dialogId={selectedDialogId} />
                </div>
              ) : (
                <div style={{ color: '#888' }}>Select a dialog from the left to start chatting</div>
              )}
            </Content>

            <Footer style={{ textAlign: 'center', background: '#1f1f1f', color: '#999', height: 70 }}>
              ©{new Date().getFullYear()} Sulimin Systems
            </Footer>
          </Layout>
        </Layout>
      </ConfigProvider>
    </GoogleOAuthProvider>
  );
};

export default App;
