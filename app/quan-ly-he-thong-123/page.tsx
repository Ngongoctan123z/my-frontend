'use client'

import React, { useState } from 'react'
import { Users, Settings, FileText, MessageSquare, Wallet, ArrowDownLeft, Link2, Mic } from 'lucide-react'
import Link from 'next/link'

// Tabs components
import { UsersTab } from '@/src/components/admin/UsersTab'
import { ModelsTab } from '@/src/components/admin/ModelsTab'
import { PromptsTab } from '@/src/components/admin/PromptsTab'
import { PromptRelationsTab } from '@/src/components/admin/PromptRelationsTab'
import { SpeakingAdminTab } from '@/src/components/admin/SpeakingAdminTab'
import { SeoTab } from '@/src/components/admin/SeoTab'
import { ChatTab } from '@/src/components/admin/ChatTab'
import { BankHookTab } from '@/src/components/admin/BankHookTab'

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('relations')

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-6 mt-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h1 className="text-3xl font-black text-slate-800">Quản Trị Hệ Thống</h1>
        <Link
          href="/quan-ly-he-thong-123/bankhook"
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl text-xs font-bold border border-emerald-200 transition-colors shadow-sm"
        >
          <ArrowDownLeft size={16} />
          Trang Giao Dịch BankHook
        </Link>
      </div>
      
      <div className="flex items-center gap-2 sm:gap-4 border-b border-gray-200 overflow-x-auto pb-1 no-scrollbar">
        <button
          onClick={() => setActiveTab('relations')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 whitespace-nowrap transition-colors ${activeTab === 'relations' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
        >
          <Link2 size={18} />
          Quan Hệ Bộ Đề (1+2)
        </button>
        <button
          onClick={() => setActiveTab('prompts')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 whitespace-nowrap transition-colors ${activeTab === 'prompts' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
        >
          <FileText size={18} />
          Kho Đề Writing
        </button>
        <button
          onClick={() => setActiveTab('speaking')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 whitespace-nowrap transition-colors ${activeTab === 'speaking' ? 'border-violet-600 text-violet-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
        >
          <Mic size={18} />
          Quản Lý Speaking
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 whitespace-nowrap transition-colors ${activeTab === 'users' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
        >
          <Users size={18} />
          Người Dùng
        </button>
        <button
          onClick={() => setActiveTab('models')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 whitespace-nowrap transition-colors ${activeTab === 'models' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
        >
          <Settings size={18} />
          Cấu hình Groq AI
        </button>
        <button
          onClick={() => setActiveTab('seo')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 whitespace-nowrap transition-colors ${activeTab === 'seo' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
        >
          <FileText size={18} />
          Cấu hình SEO
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 whitespace-nowrap transition-colors ${activeTab === 'chat' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
        >
          <MessageSquare size={18} />
          Hỗ Trợ Khách
        </button>
        <button
          onClick={() => setActiveTab('bankhook')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 whitespace-nowrap transition-colors ${activeTab === 'bankhook' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
        >
          <Wallet size={18} />
          Giao Dịch BankHook
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm min-h-[500px]">
        {activeTab === 'relations' && <PromptRelationsTab onNavigateToPrompts={() => setActiveTab('prompts')} />}
        {activeTab === 'prompts' && <PromptsTab />}
        {activeTab === 'speaking' && <SpeakingAdminTab />}
        {activeTab === 'users' && <UsersTab />}
        {activeTab === 'models' && <ModelsTab />}
        {activeTab === 'seo' && <SeoTab />}
        {activeTab === 'chat' && <ChatTab />}
        {activeTab === 'bankhook' && <BankHookTab />}
      </div>
    </div>
  )
}
