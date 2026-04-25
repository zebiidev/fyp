import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { FaSearch, FaPaperPlane, FaPaperclip, FaSmile, FaCheckDouble, FaCircle, FaTrashAlt, FaArrowLeft, FaPhone } from 'react-icons/fa';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import { toast } from 'react-toastify';
import { addMessage, fetchChatHistory, fetchConversations, removeMessage } from '../../store/slices/chatSlice';
import api from '../../utils/api';
import { uploadImageToImageKit } from '../../utils/imagekitUpload';
import { getSocket } from '../../utils/socket';

const ChatListItem = ({ chat, active, onClick }) => (
    <div
        onClick={onClick}
        className={`flex items-center gap-4 p-4 cursor-pointer transition-all border-l-4 ${active ? 'bg-indigo-50 border-primary' : 'bg-white border-transparent hover:bg-slate-50'}`}
    >
        <div className="relative">
            <img
                src={chat.avatar}
                alt={chat.name}
                className="w-12 h-12 rounded-full border border-slate-100"
                onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = chat.fallbackAvatar || chat.avatar;
                }}
            />
            {chat.online && <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white"></div>}
        </div>
        <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start mb-1">
                <h4 className="text-sm font-bold text-slate-800 truncate">{chat.name}</h4>
                <span className="text-[10px] text-slate-400 font-bold">{chat.time}</span>
            </div>
            <p className="text-xs text-slate-500 truncate">{chat.lastMessage}</p>
        </div>
        {chat.unread > 0 && (
            <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center text-[10px] font-bold text-white">
                {chat.unread}
            </div>
        )}
    </div>
);

const EMOJIS = ['\u{1F600}', '\u{1F601}', '\u{1F602}', '\u{1F60D}', '\u{1F60E}', '\u{1F91D}', '\u{1F44D}', '\u{1F64F}', '\u{1F697}', '\u{1F389}'];

const MessageBubble = ({ message, own, onDelete, deleting }) => (
    <div className={`flex ${own ? 'justify-end' : 'justify-start'} mb-4`}>
        <div className={`max-w-[70%] p-3 rounded-2xl text-sm relative ${own ? 'bg-primary text-white rounded-tr-none' : 'bg-slate-100 text-slate-700 rounded-tl-none'}`}>
            {own ? (
                <button
                    type="button"
                    onClick={() => onDelete(message.id)}
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white text-rose-500 border border-rose-100 flex items-center justify-center"
                    title="Delete message"
                    disabled={deleting}
                >
                    <FaTrashAlt size={10} />
                </button>
            ) : null}
            {message.imageUrl ? (
                <img src={message.imageUrl} alt="Chat attachment" className="max-h-64 rounded-xl mb-2 border border-slate-200" />
            ) : null}
            {message.text ? <p>{message.text}</p> : null}
            <div className={`flex items-center gap-1 mt-1 ${own ? 'text-indigo-200' : 'text-slate-400'} text-[10px] font-bold`}>
                {message.time}
                {own && <FaCheckDouble size={10} />}
            </div>
        </div>
    </div>
);

const Messages = () => {
    const dispatch = useDispatch();
    const [searchParams] = useSearchParams();
    const socketRef = useRef(null);
    const selectedChatRef = useRef(null);
    const { conversations, messages } = useSelector((state) => state.chat);
    const { user, token } = useSelector((state) => state.auth);
    const currentUserId = user?.id || user?._id || null;
    const isAdmin = user?.role === 'admin';
    const [selectedChat, setSelectedChat] = useState(null);
    const [adminContact, setAdminContact] = useState(null);
    const [text, setText] = useState('');
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [deletingMessageId, setDeletingMessageId] = useState(null);
    const [isMobile, setIsMobile] = useState(() => (typeof window !== 'undefined' ? window.innerWidth < 768 : false));
    const [mobileView, setMobileView] = useState('list');
    const fileInputRef = useRef(null);
    const targetUserId = searchParams.get('userId');
    const targetUserName = searchParams.get('name') || 'User';
    const rideId = searchParams.get('rideId');
    const showCallButton = Boolean(rideId) && Boolean(targetUserId) && selectedChat?.toString() === targetUserId?.toString() && !isAdmin;

    useEffect(() => {
        selectedChatRef.current = selectedChat;
    }, [selectedChat]);

    useEffect(() => {
        if (token) {
            dispatch(fetchConversations());
        }
    }, [dispatch, token]);

    useEffect(() => {
        const loadAdminContact = async () => {
            if (!token || isAdmin) return;
            try {
                const res = await api.get('/chat/admin');
                setAdminContact(res.data?.user || null);
            } catch {
                setAdminContact(null);
            }
        };
        loadAdminContact();
    }, [isAdmin, token]);

    const mappedChats = useMemo(() => {
        const list = (conversations || []).map((conv) => {
            const avatarSeed = encodeURIComponent(conv.user.name);
            const fallbackAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}`;
            return ({
            id: conv.user._id,
            name: conv.user.name,
            avatar: conv.user.avatar || fallbackAvatar,
            fallbackAvatar,
            lastMessage: conv.lastMessage || 'Start conversation',
            time: conv.time ? new Date(conv.time).toLocaleTimeString() : '',
            timeRaw: conv.time ? new Date(conv.time).getTime() : 0,
            unread: conv.unread || 0,
            online: onlineUsers.includes(conv.user._id.toString())
        })});

        if (adminContact && !list.some((chat) => chat.id === adminContact._id)) {
            const adminSeed = encodeURIComponent(adminContact.name || 'Admin');
            const adminFallback = `https://api.dicebear.com/7.x/avataaars/svg?seed=${adminSeed}`;
            list.unshift({
                id: adminContact._id,
                name: adminContact.name || 'Admin Support',
                avatar: adminContact.avatar || adminFallback,
                fallbackAvatar: adminFallback,
                lastMessage: 'Contact admin support',
                time: '',
                timeRaw: 0,
                unread: 0,
                online: onlineUsers.includes(adminContact._id.toString())
            });
        }

        if (targetUserId && targetUserId !== currentUserId && !list.some((chat) => chat.id === targetUserId)) {
            const targetSeed = encodeURIComponent(targetUserName);
            const targetFallback = `https://api.dicebear.com/7.x/avataaars/svg?seed=${targetSeed}`;
            list.unshift({
                id: targetUserId,
                name: targetUserName,
                avatar: targetFallback,
                fallbackAvatar: targetFallback,
                lastMessage: 'Start conversation',
                time: '',
                timeRaw: 0,
                unread: 0,
                online: onlineUsers.includes(targetUserId.toString())
            });
        }

        return list.sort((a, b) => (b.timeRaw || 0) - (a.timeRaw || 0));
    }, [adminContact, conversations, currentUserId, onlineUsers, targetUserId, targetUserName]);

    useEffect(() => {
        if (targetUserId && targetUserId !== currentUserId) {
            setSelectedChat(targetUserId);
            if (isMobile) {
                setMobileView('chat');
            }
        }
    }, [currentUserId, isMobile, targetUserId]);

    useEffect(() => {
        if (!mappedChats.length) {
            setSelectedChat(null);
            return;
        }

        const exists = mappedChats.some((chat) => chat.id === selectedChat);
        if (!exists) {
            setSelectedChat(mappedChats[0].id);
        }
    }, [mappedChats, selectedChat]);

    useEffect(() => {
        if (selectedChat) {
            dispatch(fetchChatHistory(selectedChat));
        }
    }, [dispatch, selectedChat]);

    useEffect(() => {
        const onResize = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);
            if (!mobile) {
                setMobileView('list');
            }
        };

        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    useEffect(() => {
        if (!currentUserId || !token) return undefined;

        const socket = getSocket(token);
        socketRef.current = socket;

        if (socket.connected) {
            socket.emit('join_chat');
        }

        socket.on('connect', () => {
            socket.emit('join_chat');
        });

        socket.on('connect_error', (err) => {
            console.error('Socket connect error:', err.message);
        });

        socket.on('online_users', (users) => {
            setOnlineUsers((users || []).map((id) => id.toString()));
        });

        socket.on('receive_message', (newMessage) => {
            const myId = currentUserId.toString();
            const activeId = selectedChatRef.current ? selectedChatRef.current.toString() : null;
            const senderId = newMessage?.sender?.toString();
            const recipientId = newMessage?.recipient?.toString();

            const isActiveThread = activeId && (
                (senderId === myId && recipientId === activeId) ||
                (senderId === activeId && recipientId === myId)
            );

            if (isActiveThread) {
                dispatch(addMessage(newMessage));
            }

            dispatch(fetchConversations());
        });

        socket.on('message_deleted', ({ messageId, sender, recipient }) => {
            const activeId = selectedChatRef.current ? selectedChatRef.current.toString() : null;
            const myId = currentUserId.toString();
            const isActiveThread = activeId && (
                (sender?.toString() === myId && recipient?.toString() === activeId) ||
                (sender?.toString() === activeId && recipient?.toString() === myId)
            );

            if (isActiveThread) {
                dispatch(removeMessage(messageId));
            }

            dispatch(fetchConversations());
        });

        return () => {
            socket.off('online_users');
            socket.off('receive_message');
            socket.off('message_deleted');
            socketRef.current = null;
        };
    }, [currentUserId, dispatch, token]);

    const displayedMessages = (messages && messages.length > 0)
        ? messages.map((msg) => ({
            id: msg._id,
            text: msg.text,
            imageUrl: msg.imageUrl,
            time: new Date(msg.createdAt).toLocaleTimeString(),
            own: msg.sender?.toString() === currentUserId?.toString()
        }))
        : [];

    const activeChat = mappedChats.find((chat) => chat.id === selectedChat) || mappedChats[0];

    const handleSend = () => {
        const content = text.trim();
        if (!content || !selectedChat || !currentUserId || !socketRef.current) return;

        socketRef.current.emit('send_message', {
            recipient: selectedChat,
            text: content
        });

        setText('');
    };

    // Uses shared ImageKit upload helper.

    const handleAttachmentClick = () => {
        if (!selectedChat || uploadingImage) return;
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file || !selectedChat || !socketRef.current) return;

        if (!file.type.startsWith('image/')) {
            toast.error('Please select an image file');
            e.target.value = '';
            return;
        }

        try {
            setUploadingImage(true);
            const imageUrl = await uploadImageToImageKit(file);

            socketRef.current.emit('send_message', {
                recipient: selectedChat,
                messageType: 'image',
                imageUrl
            });
        } catch (error) {
            toast.error(error.message || 'Failed to upload image');
        } finally {
            setUploadingImage(false);
            e.target.value = '';
        }
    };

    const handleEmojiClick = (emoji) => {
        setText((prev) => `${prev}${emoji}`);
        setShowEmojiPicker(false);
    };

    const handleDeleteMessage = async (messageId) => {
        try {
            setDeletingMessageId(messageId);
            await api.delete(`/chat/message/${messageId}`);
            dispatch(removeMessage(messageId));
            dispatch(fetchConversations());
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete message');
        } finally {
            setDeletingMessageId(null);
        }
    };

    const handleOpenChat = (chatId) => {
        setSelectedChat(chatId);
        if (isMobile) {
            setMobileView('chat');
        }
    };

    const handleCall = async () => {
        if (!rideId || !selectedChat) return;
        try {
            const res = await api.get(`/rides/${rideId}/contact`, { params: { userId: selectedChat } });
            const phoneRaw = res?.data?.phoneNumber;
            const phone = String(phoneRaw || '').replace(/[^\d+]/g, '');
            if (!phone) {
                toast.error('Phone number not available');
                return;
            }
            window.location.href = `tel:${phone}`;
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Unable to open dialer');
        }
    };

    return (
        <div className="h-[calc(100vh-12rem)] min-h-[500px] flex bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className={`${isMobile ? (mobileView === 'list' ? 'w-full flex' : 'hidden') : 'w-full md:w-80 flex'} border-r border-slate-100 flex-col`}>
                <div className="p-4 border-b border-slate-100">
                    <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                            <FaSearch size={14} />
                        </span>
                        <input
                            type="text"
                            placeholder="Search messages..."
                            className="w-full bg-slate-50 border-none rounded-xl pl-10 pr-4 py-2 text-xs focus:ring-1 focus:ring-primary"
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {mappedChats.length === 0 ? (
                        <div className="p-6 text-sm text-slate-500 space-y-3">
                            <p>No conversations yet.</p>
                            {adminContact && (
                                <button
                                    type="button"
                                    onClick={() => handleOpenChat(adminContact._id)}
                                    className="text-xs font-black uppercase tracking-widest text-primary"
                                >
                                    Start chat with Admin
                                </button>
                            )}
                        </div>
                    ) : (
                        mappedChats.map((chat) => (
                            <ChatListItem
                                key={chat.id}
                                chat={chat}
                                active={selectedChat === chat.id}
                                onClick={() => handleOpenChat(chat.id)}
                            />
                        ))
                    )}
                </div>
            </div>

            <div className={`${isMobile ? (mobileView === 'chat' ? 'flex' : 'hidden') : 'flex'} flex-1 flex-col min-w-0`}>
                <header className="p-4 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {isMobile && (
                            <button
                                type="button"
                                onClick={() => setMobileView('list')}
                                className="w-8 h-8 rounded-full border border-slate-200 text-slate-500 flex items-center justify-center"
                            >
                                <FaArrowLeft size={12} />
                            </button>
                        )}
                        <img
                            src={activeChat?.avatar}
                            alt=""
                            className="w-10 h-10 rounded-full border"
                            onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = activeChat?.fallbackAvatar || activeChat?.avatar;
                            }}
                        />
                        <div>
                            <h4 className="text-sm font-bold text-slate-800">{activeChat?.name}</h4>
                            <div className="flex items-center gap-1">
                                <FaCircle className={activeChat?.online ? 'text-emerald-500' : 'text-slate-400'} size={8} />
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    {activeChat?.online ? 'Online' : 'Offline'}
                                </span>
                            </div>
                        </div>
                    </div>
                    {showCallButton ? (
                        <button
                            type="button"
                            onClick={handleCall}
                            className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all"
                            title="Call"
                        >
                            <FaPhone size={14} />
                        </button>
                    ) : null}
                </header>

                <div className="flex-1 p-6 overflow-y-auto bg-slate-50/50">
                    {displayedMessages.length === 0 ? (
                        <div className="text-sm text-slate-500">
                            {selectedChat ? 'No messages yet. Say hello!' : 'Choose a conversation to start chatting.'}
                        </div>
                    ) : (
                        displayedMessages.map((msg) => (
                            <MessageBubble
                                key={msg.id}
                                message={msg}
                                own={msg.own}
                                onDelete={handleDeleteMessage}
                                deleting={deletingMessageId === msg.id}
                            />
                        ))
                    )}
                </div>

                <div className="p-4 border-t border-slate-100 flex items-center gap-4">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                    />
                    <button
                        onClick={handleAttachmentClick}
                        className="text-slate-400 hover:text-primary transition-colors disabled:opacity-50"
                        disabled={!selectedChat || uploadingImage}
                    >
                        <FaPaperclip />
                    </button>
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleSend();
                                }
                            }}
                            placeholder="Type a message..."
                            className="w-full bg-slate-100 border-none rounded-2xl px-5 py-3 text-sm focus:ring-2 focus:ring-primary transition-all pr-12"
                            disabled={!selectedChat}
                        />
                        <button
                            onClick={() => setShowEmojiPicker((prev) => !prev)}
                            className="absolute inset-y-0 right-4 flex items-center text-slate-400 hover:text-primary transition-colors"
                            type="button"
                        >
                            <FaSmile />
                        </button>
                        {showEmojiPicker && (
                            <div className="absolute bottom-14 right-0 bg-white border border-slate-200 shadow-md rounded-xl p-2 grid grid-cols-5 gap-1 z-20">
                                {EMOJIS.map((emoji) => (
                                    <button
                                        key={emoji}
                                        type="button"
                                        onClick={() => handleEmojiClick(emoji)}
                                        className="text-lg leading-none p-1 hover:bg-slate-100 rounded"
                                    >
                                        {emoji}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={handleSend}
                        className="w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100 hover:bg-primary-dark transition-all"
                        disabled={!selectedChat || uploadingImage}
                    >
                        <FaPaperPlane />
                    </motion.button>
                </div>
            </div>
        </div>
    );
};

export default Messages;
