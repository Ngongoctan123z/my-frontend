'use client'

import React, { useState } from 'react'
import { Users, Settings, FileText } from 'lucide-react'

// Tabs components
import { UsersTab } from '@/src/components/admin/UsersTab'
import { ModelsTab } from '@/src/components/admin/ModelsTab'
import { PromptsTab } from '@/src/components/admin/PromptsTab'

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('users')

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-6 mt-10">
      <h1 className="text-3xl font-black text-slate-800">Quản Trị Hệ Thống</h1>
      
      <div className="flex items-center gap-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'users' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
        >
          <Users size={18} />
          Người Dùng
        </button>
        <button
          onClick={() => setActiveTab('models')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'models' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
        >
          <Settings size={18} />
          Cấu hình Groq AI
        </button>
        <button
          onClick={() => setActiveTab('prompts')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'prompts' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
        >
          <FileText size={18} />
          Kho Đề Writing
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm min-h-[500px]">
        {activeTab === 'users' && <UsersTab />}
        {activeTab === 'models' && <ModelsTab />}
        {activeTab === 'prompts' && <PromptsTab />}
      </div>
    </div>
  )
}
