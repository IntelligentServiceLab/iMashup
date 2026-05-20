import { useState, useEffect, useRef, useCallback } from 'react';
import { Drawer, Input, Button, List, Flex, message, Spin, Empty, Card, Avatar } from 'antd';
import {
  SendOutlined,
  HistoryOutlined,
  ArrowLeftOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { DeleteOutlined } from '@ant-design/icons';
import axios from 'axios';
import { baseURL, Timer } from '../../common.ts';
import './Message.css';

interface SessionMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: number;
  loading?: boolean;
  isSubTaskResult?: boolean;
  isApiResult?: boolean;
}

interface ConversationItem {
  sessionId?: string;
  title: string;
  lastMessage: string;
  updateTime: number;
}

interface MessageProps {
  visible: boolean;
  onClose: () => void;
  currentUser: string;
  onRequireLogin: () => void;
  onAiFlowGenerated?: (aiFlow: any) => void;
}

const INIT_MESSAGE = '请描述您的工作流需求，我会尽力为您推荐合适的工作流模板！';

type ViewMode = 'current' | 'history-list' | 'history-detail';

const createId = (prefix: string) =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const buildInitMessage = (): SessionMessage => ({
  id: createId('ai_init'),
  type: 'ai',
  content: INIT_MESSAGE,
  timestamp: Date.now(),
});

const Message: React.FC<MessageProps> = ({
  visible,
  onClose,
  currentUser,
  onRequireLogin,
  onAiFlowGenerated,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('current');

  // 当前默认会话 ID（“返回当前会话”时使用）
  const [currentSessionId, setCurrentSessionId] = useState('');

  // 当前页面正在展示的会话 ID 和消息
  const [activeSessionId, setActiveSessionId] = useState('');
  const [messages, setMessages] = useState<SessionMessage[]>([]);
  const [sseSessionId, setSseSessionId] = useState('');

  // 历史会话列表
  const [conversationList, setConversationList] = useState<ConversationItem[]>([]);

  // 输入框
  const [inputValue, setInputValue] = useState('');

  // 状态
  const [sending, setSending] = useState(false);
  const [creatingSession, setCreatingSession] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);

  // 子任务和流程图相关
  const [aiFlow, setAiFlow] = useState<any>(null);
  const [showSubTaskResult, setShowSubTaskResult] = useState(false);
  const [matchingApi, setMatchingApi] = useState(false);

  // 会话状态管理
  const [sessionSavedToDB, setSessionSavedToDB] = useState(false);

  const sseRef = useRef<EventSource | null>(null);
  const pollingIntervalRef = useRef<Timer | null>(null);
  const getSubTasksRef = useRef<((() => Promise<void>) | null)>(null);
  const prevUserRef = useRef(currentUser);

  const [guestId] = useState(
    () => `guest_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  );

  const isLogin = !!currentUser;
  const sessionUser = currentUser || guestId;

  const isHistoryListView = viewMode === 'history-list';
  const isHistoryDetailView = viewMode === 'history-detail';
  const hasLoadingMessage = messages.some((msg) => msg.loading);
  const canSend = viewMode !== 'history-list' && !sending && !creatingSession && !messages.some((msg) => msg.loading) && !hasLoadingMessage;

  const closeSSE = useCallback(() => {
    if (sseRef.current) {
      sseRef.current.close();
      sseRef.current = null;
    }
    setSseSessionId('');
  }, []);

  const appendMessage = useCallback((msg: SessionMessage) => {
    setMessages((prev) => [...prev, msg]);
  }, []);

  const removeLoadingMessage = useCallback(() => {
    setMessages((prev) => prev.filter((msg) => !msg.loading));
  }, []);

  const initSSE = useCallback(
    (sessionId: string) => {
      if (!sessionId) return;
      if (sseRef.current && sseSessionId === sessionId) {
        return;
      }

      closeSSE();

      try {
        const es = new EventSource(
          `${baseURL}/sse/connect?username=${encodeURIComponent(
            sessionUser
          )}&sessionId=${encodeURIComponent(sessionId)}`,
          { withCredentials: true }
        );

        sseRef.current = es;
        setSseSessionId(sessionId);

        const appendAiMessageFromData = (data: any, fallbackContent = '') => {
          removeLoadingMessage();

          appendMessage({
            id: data?.id || createId('ai'),
            type: 'ai',
            content: data?.content || fallbackContent,
            timestamp: data?.timestamp || Date.now(),
          });
        };

        es.addEventListener('card_update', (event) => {
          try {
            const data = JSON.parse(event.data);
            appendAiMessageFromData(data);
          } catch (error) {
            console.error('解析 SSE 消息失败：', error);
            message.error('会话消息格式错误');
          }
        });

        es.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);

            // 根据消息类型进行不同处理
            if (data.type === 'init') {
              return;
            } else if (data.type === 'subTask') {
              removeLoadingMessage();
              appendMessage({
                id: data.id || createId('ai_subtask'),
                type: 'ai',
                content: data.content || '子任务拆分中...',
                timestamp: data.timestamp || Date.now(),
              });
            } else if (data.type === 'progress') {
              // 进度更新
              appendMessage({
                id: data.id || createId('ai_progress'),
                type: 'ai',
                content: data.content || '处理中...',
                timestamp: data.timestamp || Date.now(),
              });
            } else if (data.type === 'api_result') {
              // API 结果
              appendMessage({
                id: data.id || createId('ai_result'),
                type: 'ai',
                content: data.content || 'API 匹配结果',
                timestamp: data.timestamp || Date.now(),
              });
            } else if (data.type === 'final_result') {
              // 最终结果
              removeLoadingMessage();
              appendMessage({
                id: data.id || createId('ai_final'),
                type: 'ai',
                content: data.content || '处理完成',
                timestamp: data.timestamp || Date.now(),
              });
            } else if (data.type === 'error') {
              // 错误消息
              removeLoadingMessage();
              appendMessage({
                id: data.id || createId('ai_error'),
                type: 'ai',
                content: data.content || '发生错误',
                timestamp: data.timestamp || Date.now(),
              });
            } else if (data.type === 'ping') {
              // 心跳，不显示
              return;
            } else if (data.type === 'reset') {
              removeLoadingMessage();
              setMessages([buildInitMessage()]);
              setShowSubTaskResult(false);
              setAiFlow(null);
              message.success('本次流程已完成，你可以继续提出新的需求！');
              return;
            } else {
              // 默认处理
              appendAiMessageFromData(data, event.data);
            }
          } catch {
            removeLoadingMessage();

            appendMessage({
              id: createId('ai_text'),
              type: 'ai',
              content: event.data,
              timestamp: Date.now(),
            });
          }
        };

        es.onerror = (error) => {
          console.error('SSE连接异常：', error);
        };
      } catch (error) {
        console.error('建立SSE连接失败：', error);
        message.error('无法建立会话，请检查后端是否启动');
      }
    },
    [sessionUser, closeSSE, appendMessage, sseSessionId, removeLoadingMessage]
  );

  const createSession = useCallback(async () => {
    try {
      setCreatingSession(true);

      const res = await axios.post(`${baseURL}/sse/creat`, {
        username: sessionUser,
      });

      if (res.data.code === 200 && res.data.data) {
        return res.data.data as string;
      }

      message.error(res.data.msg || '创建会话失败');
      return '';
    } catch (error) {
      console.error('创建会话失败：', error);
      message.error('创建会话失败');
      return '';
    } finally {
      setCreatingSession(false);
    }
  }, [sessionUser]);

  const createCurrentSession = useCallback(async () => {
    const newSessionId = await createSession();
    if (!newSessionId) return;

    const initMsg = buildInitMessage();

    setCurrentSessionId(newSessionId);
    setActiveSessionId(newSessionId);
    setMessages([initMsg]);
    setViewMode('current');
    setInputValue('');
    setSessionSavedToDB(false);
  }, [createSession]);

  const ensureCurrentSession = useCallback(async () => {
    if (currentSessionId) return currentSessionId;

    const newSessionId = await createSession();
    if (!newSessionId) return '';

    const initMsg = buildInitMessage();

    setCurrentSessionId(newSessionId);
    setActiveSessionId(newSessionId);
    setMessages([initMsg]);

    return newSessionId;
  }, [currentSessionId, createSession]);

  const loadConversationList = useCallback(async () => {
    if (!currentUser) {
      onRequireLogin();
      return;
    }

    try {
      setHistoryLoading(true);

      const res = await axios.get(`${baseURL}/sse/list`, {
        params: { username: currentUser },
      });

      if (res.data.code === 200) {
        setConversationList(Array.isArray(res.data.data) ? res.data.data : []);
      } else {
        setConversationList([]);
        message.info(res.data.msg || '暂无历史会话');
      }

      setViewMode('history-list');
      setInputValue('');
    } catch (error) {
      console.error('加载会话列表失败：', error);
      setConversationList([]);
      message.error('加载历史会话失败');
    } finally {
      setHistoryLoading(false);
    }
  }, [currentUser, onRequireLogin]);

  const loadSessionDetail = useCallback(
    async (sessionId: string, targetViewMode?: ViewMode) => {
      if (!sessionId) return;

      try {
        setHistoryLoading(true);

        const res = await axios.get(`${baseURL}/sse/detail`, {
          params: {
            username: sessionUser,
            sessionId,
          },
        });

        if (res.data.code === 200) {
          const messageData = res.data.data || {};
          const messagesData = Array.isArray(messageData.messages) ? messageData.messages : [];

          setActiveSessionId(sessionId);
          setMessages(messagesData);

          if (targetViewMode) {
            setViewMode(targetViewMode);
          }
        } else {
          message.error(res.data.msg || '加载会话详情失败');
        }
      } catch (error) {
        console.error('加载会话详情失败：', error);
        message.error('加载会话详情失败');
      } finally {
        setHistoryLoading(false);
      }
    },
    [sessionUser]
  );

  const openConversation = useCallback(
    async (sessionId?: string) => {
      if (!sessionId) {
        message.error('会话ID缺失，无法打开历史会话');
        return;
      }

      await loadSessionDetail(sessionId, 'history-detail');
      setInputValue('');
    },
    [loadSessionDetail]
  );

  const backToHistoryList = useCallback(() => {
    setViewMode('history-list');
    setInputValue('');
  }, []);

  const backToCurrentSession = useCallback(async () => {
    setInputValue('');

    if (!currentSessionId) {
      await createCurrentSession();
      return;
    }

    setActiveSessionId(currentSessionId);
    setViewMode('current');
  }, [currentSessionId]);

  const sendMessage = useCallback(
    async (content: string) => {
      const trimmed = content.trim();

      if (!trimmed) {
        message.warning('请输入内容');
        return;
      }

      if (!canSend) return;

      const targetIsHistory = viewMode === 'history-detail';
      let sessionId = activeSessionId;

      if (!targetIsHistory) {
        sessionId = await ensureCurrentSession();
      }

      if (!sessionId) {
        message.error('会话不存在，请重新进入');
        return;
      }

      const userMsg: SessionMessage = {
        id: createId('user'),
        type: 'user',
        content: trimmed,
        timestamp: Date.now(),
      };

      const loadingMsg: SessionMessage = {
        id: createId('ai_loading'),
        type: 'ai',
        content: '正在生成回复...',
        timestamp: Date.now(),
        loading: true,
      };

      appendMessage(userMsg);
      appendMessage(loadingMsg);
      setInputValue('');

      try {
        setSending(true);

        // 如果会话还未保存到数据库且是登录用户，则先保存会话
        if (isLogin && !sessionSavedToDB && viewMode === 'current') {
          try {
            await axios.post(`${baseURL}/sse/saveSession`, {
              username: sessionUser,
              sessionId,
            });
            setSessionSavedToDB(true);
          } catch (error) {
            console.warn('保存会话失败，继续发送消息:', error);
          }
        }

        const res = await axios.post(
          `${baseURL}/sse/send`,
          {
            username: sessionUser,
            sessionId,
            userText: trimmed,
          },
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        console.log('完整响应对象:', res);
        console.log('响应状态码:', res.status);
        console.log('响应数据:', res.data);

        if (res.data.code !== 200) {
          console.error('后端返回错误:', res.data);
          throw new Error(res.data.msg || '发送失败');
        }

        // 发送成功，启动轮询获取子任务
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }

        // 每 500ms 轮询一次
        pollingIntervalRef.current = setInterval(() => {
          if (getSubTasksRef.current) {
            getSubTasksRef.current();
          }
        }, 500);
      } catch (error) {
        console.error('发送消息失败：', error);
        console.error('完整响应:', error instanceof axios.AxiosError ? error.response?.data : error);
        message.error('发送失败，请重试');
        setMessages((prev) =>
          prev.filter((msg) => msg.id !== userMsg.id && msg.id !== loadingMsg.id)
        );
      } finally {
        setSending(false);
      }
    },
    [canSend, viewMode, activeSessionId, ensureCurrentSession, appendMessage, sessionUser]
  );

  const getSubTasks = useCallback(async () => {
    if (!activeSessionId) {
      return;
    }

    try {
      const res = await axios.get(`${baseURL}/sse/getSubTasks`, {
        params: {
          sessionId: activeSessionId,
          username: sessionUser,
        },
      });

      if (res.data.code === 200) {
        const { taskText: text, aiFlow: flow } = res.data.data || {};
        setAiFlow(flow || null);
        setShowSubTaskResult(true);

        // 停止轮询
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }

        // 显示后端拼接的任务文段
        appendMessage({
          id: createId('ai_result_display'),
          type: 'ai',
          content: text || '子任务处理完成',
          timestamp: Date.now(),
          isSubTaskResult: true,
        });

        // 将流程图数据传给 App.tsx，渲染到画布
        if (onAiFlowGenerated && flow) {
          onAiFlowGenerated(flow);
        }
      } else if (res.data.code === -99) {
        return;
      } else if (res.data.code === -1) {
        return;
      }
    } catch (error) {
      console.debug('轮询子任务中...', error);
    }
  }, [activeSessionId, sessionUser, appendMessage, onAiFlowGenerated]);

  useEffect(() => {
    getSubTasksRef.current = getSubTasks;
  }, [getSubTasks]);

  const apiChoice = useCallback(async () => {
    if (!activeSessionId || !aiFlow) {
      message.error('数据不完整');
      return;
    }

    try {
      setMatchingApi(true);

      const res = await axios.post(
        `${baseURL}/sse/apiChoice`,
        {
          sessionId: activeSessionId,
          username: sessionUser,
          ai: aiFlow,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (res.data.code === 200) {
        const { apiData, taskText: resultText } = res.data.data || {};

        // 显示 API 匹配结果文段
        if (resultText) {
          appendMessage({
            id: createId('ai_api_result'),
            type: 'ai',
            content: resultText,
            timestamp: Date.now(),
            isApiResult: true,
          });
        }

        // 将更新后的流程图传给 App.tsx
        if (onAiFlowGenerated && apiData) {
          setAiFlow(apiData);
          onAiFlowGenerated(apiData);
        }

        // 一轮完成后自动恢复初始状态，供用户继续发问题
        setTimeout(() => {
          appendMessage(buildInitMessage());
          setShowSubTaskResult(false);
          setAiFlow(null);
        }, 1000);
      } else {
        message.error(res.data.msg || 'API 匹配失败');
      }
    } catch (error) {
      console.error('API 匹配失败：', error);
      message.error('API 匹配失败');
    } finally {
      setMatchingApi(false);
    }
  }, [activeSessionId, aiFlow, sessionUser, appendMessage, onAiFlowGenerated]);

  const handleContinue = useCallback(() => {
    setShowSubTaskResult(false);
    message.loading('正在匹配 API...');
    apiChoice();
  }, [apiChoice]);

  const handleRetry = useCallback(async () => {
    setShowSubTaskResult(false);
    setAiFlow(null);
    setSessionSavedToDB(false);

    closeSSE();

    await createCurrentSession();

    message.info('已重置，请重新输入需求');
  }, [createCurrentSession, closeSSE]);

  const renderMessageList = () => (
    <div className="session-list">
      <List
        dataSource={messages}
        locale={{ emptyText: <Empty description="暂无消息" /> }}
        renderItem={(item) => (
          <List.Item key={item.id} className={`session-item ${item.type}`}>
            <List.Item.Meta
              avatar={
                item.type === 'user' ? (
                  <Avatar
                    size={42}
                    src="public\user.png"
                    style={{
                      backgroundColor: 'transparent',
                      border: 'none',
                    }}
                  >
                    👤
                  </Avatar>
                ) : (
                  <Avatar
                    size={44}
                    src="public\AI.png"
                    style={{
                      backgroundColor: 'transparent',
                      border: 'none',
                      boxShadow: 'none',
                    }}
                  >
                    🤖
                  </Avatar>
                )
              }
              description={
                item.isSubTaskResult || item.isApiResult ? (
                  <div style={{ marginTop: 12 }}>
                    <Card
                      title={
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 18 }}>
                            {item.isSubTaskResult ? '🎯' : '🔗'}
                          </span>
                          <span>
                            {item.isSubTaskResult ? '子任务分解完成' : 'API 匹配完成'}
                          </span>
                        </div>
                      }
                      size="small"
                      style={{
                        backgroundColor: item.isSubTaskResult ? '#f0f7ff' : '#f0f7ff',
                        borderRadius: 12,
                        marginBottom: 12,
                        border: item.isSubTaskResult ? '2px solid #1890ff' : '2px solid #52c41a',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      }}
                      headStyle={{
                        borderBottom: item.isSubTaskResult ? '1px solid #91caff' : '1px solid #b7eb8f',
                        backgroundColor: item.isSubTaskResult ? '#e6f7ff' : '#f6ffed',
                      }}
                    >
                      <div
                        className="message-content"
                        style={{
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                          lineHeight: 1.8,
                          color: '#333',
                          fontSize: 13,
                        }}
                      >
                        {item.content}
                      </div>
                    </Card>
                    {item.isSubTaskResult && (
                      <Flex gap={12} style={{ marginTop: 12 }}>
                        <Button
                          type="primary"
                          onClick={handleContinue}
                          style={{ flex: 1 }}
                          size="large"
                        >
                          ✓ 继续
                        </Button>
                        <Button
                          onClick={handleRetry}
                          style={{ flex: 1 }}
                          size="large"
                        >
                          ↻ 重做
                        </Button>
                      </Flex>
                    )}
                  </div>
                ) : (
                  <div className={`message-content ${item.loading ? 'loading-message' : ''}`}>
                    {item.content}
                  </div>
                )
              }
            />
          </List.Item>
        )}
      />
    </div>
  );

  const handleNewSession = useCallback(() => {
    setConversationList([]);
    setAiFlow(null);
    setShowSubTaskResult(false);
    setSessionSavedToDB(false);
    closeSSE();
    createCurrentSession();
  }, [closeSSE, createCurrentSession]);

  const handleDeleteConversation = async (sessionId: string | undefined) => {
    if (!sessionId) return;

    try {
      await axios.post(`${baseURL}/sse/deleteSession`, null, {
        params: { username: currentUser, sessionId },
      });
      setConversationList(prev => prev.filter(i => i.sessionId !== sessionId));
      message.success("删除成功");
    } catch {
      message.error("删除失败");
    }
  };

  const renderConversationList = () => {
    if (historyLoading) {
      return (
        <div className="history-loading">
          <Spin />
        </div>
      );
    }

    if (conversationList.length === 0) {
      return (
        <div className="history-empty">
          <Empty description="暂无历史会话" />
        </div>
      );
    }

    return (
      <div className="history-list-page">
        <div className="history-list-title">历史对话</div>

        <List
          dataSource={conversationList}
          renderItem={(item) => (
            <List.Item
              key={item.sessionId || item.title}
              className="history-list-item"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "10px 12px",
                border: "1px solid #e8e8e8",
                borderRadius: 8,
                marginBottom: 8,
                background: "#fff",
              }}
            >
              {/* 左侧内容 */}
              <div
                style={{ flex: 1, cursor: "pointer" }}
                onClick={() => {
                  if (item.sessionId) openConversation(item.sessionId);
                }}
              >
                <div style={{ fontWeight: 500 }}>{item.title || "未命名会话"}</div>
                <div style={{ fontSize: 12, color: "#999", marginTop: 4 }}>
                  {item.lastMessage || "暂无内容"}
                </div>
              </div>

              {/* 强制每条都显示删除按钮 */}
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteConversation(item.sessionId);
                }}
              />
            </List.Item>
          )}
        />
      </div>
    );
  };

  const getDrawerTitle = () => {
    if (viewMode === 'history-list') return '历史记录';
    if (viewMode === 'history-detail') return '历史会话';
    return 'LLM4Mashup';
  };

  const renderExtraActions = () => {
    const commonNewButton = (
      <Button
        icon={<PlusOutlined />}
        onClick={handleNewSession}
        disabled={sending || creatingSession}
      >
        新建会话
      </Button>
    );

    if (viewMode === 'current') {
      return (
        <div style={{ display: 'flex', gap: 8 }}>
          <Button
            icon={<HistoryOutlined />}
            onClick={loadConversationList}
            loading={historyLoading}
          >
            {isLogin ? '历史记录' : '登录后查看历史'}
          </Button>
          {commonNewButton}
        </div>
      );
    }

    if (viewMode === 'history-list') {
      return (
        <div style={{ display: 'flex', gap: 8 }}>
          <Button icon={<ArrowLeftOutlined />} onClick={backToCurrentSession}>
            返回当前会话
          </Button>
          {commonNewButton}
        </div>
      );
    }

    return (
      <div style={{ display: 'flex', gap: 8 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={backToHistoryList}>
          返回历史列表
        </Button>
        {commonNewButton}
      </div>
    );
  };

  useEffect(() => {
    return () => {
      closeSSE();
    };
  }, [closeSSE]);

  useEffect(() => {
    if (!visible) return;

    if (!currentSessionId && viewMode === 'current') {
      createCurrentSession();
    }
  }, [visible, currentSessionId, viewMode, createCurrentSession]);

  useEffect(() => {
    if (!visible || !activeSessionId) {
      closeSSE();
      return;
    }
    initSSE(activeSessionId);

    return () => {
      // 仅在组件卸载或sessionId变化时关闭
      // 但不在切换视图时关闭
    };
  }, [visible, activeSessionId, initSSE]);

  // 清理轮询
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const prevUser = prevUserRef.current;

    if (prevUser !== currentUser) {
      closeSSE();
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      setConversationList([]);
      setInputValue('');
      setMessages([]);
      setCurrentSessionId('');
      setActiveSessionId('');
      setSseSessionId('');
      setAiFlow(null);
      setShowSubTaskResult(false);
      setSessionSavedToDB(false);
      setViewMode('current');
      prevUserRef.current = currentUser;
    }
  }, [currentUser, closeSSE]);

  return (
    <Drawer
      title={getDrawerTitle()}
      open={visible}
      onClose={onClose}
      footer={null}
      className="session-drawer"
      placement="left"
      extra={renderExtraActions()}
    >
      {isHistoryListView ? renderConversationList() : renderMessageList()}

      {!isHistoryListView && (
        <div className="input-area">
          <Input.TextArea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={
              isHistoryDetailView
                ? '你可以在这个历史会话里继续聊天...'
                : isLogin
                  ? '请输入工作流需求...'
                  : '请输入工作流需求(登录后可查看历史)...'
            }
            rows={3}
            disabled={sending || creatingSession || !canSend}
            onPressEnter={(e) => {
              if (!e.shiftKey) {
                e.preventDefault();
                if (canSend && !sending && !creatingSession) {
                  sendMessage(inputValue);
                }
              }
            }}
          />

          <Flex gap={8} className="input-buttons">
            <Button
              type="primary"
              onClick={() => sendMessage(inputValue)}
              icon={<SendOutlined />}
              loading={sending}
              disabled={sending || creatingSession || !canSend}
            >
              发送
            </Button>

            <Button
              onClick={() => setInputValue('')}
              disabled={sending || creatingSession || !canSend}
            >
              清空
            </Button>

            {showSubTaskResult && aiFlow && (
              <Button
                type="primary"
                onClick={apiChoice}
                loading={matchingApi}
                disabled={matchingApi || !aiFlow}
                style={{ marginLeft: 'auto' }}
              >
                匹配API
              </Button>
            )}
          </Flex>
        </div>
      )}
    </Drawer>
  );
};

export default Message;