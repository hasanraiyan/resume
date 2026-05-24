'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminGuard from '@/components/AdminGuard';
import { LayoutDashboard, Columns3, BarChart3, Trash2, Activity } from 'lucide-react';
import SessionProvider from '@/components/SessionProvider';
import AppLayout from '@/components/layout/AppLayout';
import { SkeletonProvider } from 'react-skeletonify';
import 'react-skeletonify/dist/index.css';
import BoardsTab from '@/components/kanban/BoardsTab';
import BoardView from '@/components/kanban/BoardView';
import AnalyticsTab from '@/components/kanban/AnalyticsTab';
import TrashTab from '@/components/kanban/TrashTab';
import ActivityTab from '@/components/kanban/ActivityTab';

const tabs = [
  { id: 'boards', label: 'Boards', icon: LayoutDashboard },
  { id: 'board', label: 'Board', icon: Columns3 },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'activity', label: 'Activity', icon: Activity },
  { id: 'trash', label: 'Trash', icon: Trash2 },
];

export default function KanbanApp() {
  return (
    <SessionProvider>
      <AdminGuard appName="Kanban">
        <SkeletonProvider
          config={{
            animation: 'animation-1',
            borderRadius: '8px',
            animationSpeed: 2,
            exceptTags: ['button', 'svg', 'img'],
            background: '#e5e3d8',
          }}
        >
          <KanbanContent />
        </SkeletonProvider>
      </AdminGuard>
    </SessionProvider>
  );
}

function KanbanContent() {
  const [activeTab, setActiveTab] = useState('boards');
  const [boards, setBoards] = useState([]);
  const [activeBoardId, setActiveBoardId] = useState(null);
  const [columns, setColumns] = useState([]);
  const [cards, setCards] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBoards = useCallback(async () => {
    try {
      const res = await fetch('/api/kanban/boards');
      if (res.ok) {
        const data = await res.json();
        setBoards(data.boards || []);
      }
    } catch (error) {
      console.error('Failed to fetch boards:', error);
    }
  }, []);

  const fetchBoardData = useCallback(async (boardId) => {
    if (!boardId) return;
    try {
      setIsLoading(true);
      const res = await fetch(`/api/kanban/boards/${boardId}`);
      if (res.ok) {
        const data = await res.json();
        setColumns(data.columns || []);
        setCards(data.cards || []);
      }
    } catch (error) {
      console.error('Failed to fetch board data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBoards();
  }, [fetchBoards]);

  useEffect(() => {
    if (activeBoardId) {
      fetchBoardData(activeBoardId);
    }
  }, [activeBoardId, fetchBoardData]);

  const handleSelectBoard = (boardId) => {
    setActiveBoardId(boardId);
    setActiveTab('board');
  };

  const handleBoardCreated = (board) => {
    setBoards((prev) => [board, ...prev]);
    setActiveBoardId(board._id);
    setActiveTab('board');
  };

  const handleBoardDeleted = (boardId) => {
    setBoards((prev) => prev.filter((b) => b._id !== boardId));
    if (activeBoardId === boardId) {
      setActiveBoardId(null);
      setColumns([]);
      setCards([]);
      setActiveTab('boards');
    }
  };

  const handleBoardUpdated = (board) => {
    setBoards((prev) => prev.map((b) => (b._id === board._id ? board : b)));
  };

  const handleBoardDuplicated = (newBoard) => {
    setBoards((prev) => [newBoard, ...prev]);
    setActiveBoardId(newBoard._id);
    setActiveTab('board');
  };

  const handleCardMoved = async (cardId, destColumnId, destIndex) => {
    const prevCards = [...cards];
    setCards((prev) =>
      prev.map((c) => {
        if (c._id === cardId) {
          return { ...c, columnId: destColumnId, position: destIndex };
        }
        return c;
      })
    );

    try {
      const res = await fetch(`/api/kanban/cards/${cardId}/move`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ columnId: destColumnId, position: destIndex }),
      });
      if (!res.ok) throw new Error('Move failed');
      const data = await res.json();
      setCards((prev) => prev.map((c) => (c._id === cardId ? { ...c, ...data.card } : c)));
    } catch (error) {
      console.error('Failed to move card:', error);
      setCards(prevCards);
    }
  };

  const handleCardCreated = (card) => {
    setCards((prev) => [...prev, card]);
  };

  const handleCardUpdated = (updatedCard) => {
    setCards((prev) => prev.map((c) => (c._id === updatedCard._id ? { ...c, ...updatedCard } : c)));
  };

  const handleCardDeleted = (cardId) => {
    setCards((prev) => prev.filter((c) => c._id !== cardId));
  };

  const handleColumnCreated = (column) => {
    setColumns((prev) => [...prev, column]);
  };

  const handleColumnUpdated = (updatedColumn) => {
    setColumns((prev) =>
      prev.map((c) => (c._id === updatedColumn._id ? { ...c, ...updatedColumn } : c))
    );
  };

  const handleColumnDeleted = (columnId) => {
    setColumns((prev) => prev.filter((c) => c._id !== columnId));
    setCards((prev) => prev.filter((c) => c.columnId !== columnId));
  };

  const handleRestoreFromTrash = () => {
    fetchBoards();
  };

  const activeBoard = boards.find((b) => b._id === activeBoardId);

  const tabTitles = {
    boards: 'Your Boards',
    board: activeBoard?.name || 'Select a Board',
    analytics: 'Analytics',
    activity: activeBoard ? `${activeBoard.name} Activity` : 'Activity',
    trash: 'Trash',
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'boards':
        return (
          <BoardsTab
            boards={boards}
            onSelectBoard={handleSelectBoard}
            onBoardCreated={handleBoardCreated}
            onBoardDeleted={handleBoardDeleted}
            onBoardUpdated={handleBoardUpdated}
            onBoardDuplicated={handleBoardDuplicated}
          />
        );
      case 'board':
        return activeBoardId ? (
          <BoardView
            boardId={activeBoardId}
            columns={columns}
            cards={cards}
            isLoading={isLoading}
            onCardMoved={handleCardMoved}
            onCardCreated={handleCardCreated}
            onCardUpdated={handleCardUpdated}
            onCardDeleted={handleCardDeleted}
            onColumnCreated={handleColumnCreated}
            onColumnUpdated={handleColumnUpdated}
            onColumnDeleted={handleColumnDeleted}
            onRefresh={() => fetchBoardData(activeBoardId)}
          />
        ) : (
          <div className="flex items-center justify-center h-64 text-[#7c8e88]">
            <p>Select or create a board to get started</p>
          </div>
        );
      case 'analytics':
        return activeBoardId ? (
          <AnalyticsTab boardId={activeBoardId} boards={boards} columns={columns} cards={cards} />
        ) : (
          <div className="flex items-center justify-center h-64 text-[#7c8e88]">
            <p>Select a board to view analytics</p>
          </div>
        );
      case 'activity':
        return activeBoardId ? (
          <ActivityTab boardId={activeBoardId} />
        ) : (
          <div className="flex items-center justify-center h-64 text-[#7c8e88]">
            <p>Select a board to view activity</p>
          </div>
        );
      case 'trash':
        return <TrashTab onRestore={handleRestoreFromTrash} />;
      default:
        return null;
    }
  };

  return (
    <AppLayout
      appName="Kanban"
      appLogo="/images/apps/kanban.png"
      tabs={tabs}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      tabTitles={tabTitles}
    >
      <div className="h-full">{renderContent()}</div>
    </AppLayout>
  );
}
