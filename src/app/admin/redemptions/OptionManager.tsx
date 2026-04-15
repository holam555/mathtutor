'use client'

import { useState, useTransition } from 'react'
import { saveRedemptionOption } from './actions'

type Option = {
  id: string
  reward_description: string
  tokens_required: number
  is_active: boolean
}

export default function OptionManager({ options: initial }: { options: Option[] }) {
  const [options, setOptions] = useState(initial)
  const [editing, setEditing] = useState<string | null>(null) // id or 'new'
  const [isPending, startTransition] = useTransition()

  const [formDesc, setFormDesc] = useState('')
  const [formTokens, setFormTokens] = useState('')
  const [formActive, setFormActive] = useState(true)

  function startEdit(opt: Option) {
    setEditing(opt.id)
    setFormDesc(opt.reward_description)
    setFormTokens(String(opt.tokens_required))
    setFormActive(opt.is_active)
  }

  function startNew() {
    setEditing('new')
    setFormDesc('')
    setFormTokens('')
    setFormActive(true)
  }

  function handleSave() {
    const tokens = parseInt(formTokens)
    if (!formDesc || isNaN(tokens) || tokens <= 0) return
    startTransition(async () => {
      await saveRedemptionOption(editing === 'new' ? null : editing, {
        reward_description: formDesc,
        tokens_required: tokens,
        is_active: formActive,
      })
      setEditing(null)
      // Optimistic update
      if (editing === 'new') {
        setOptions((prev) => [
          ...prev,
          { id: crypto.randomUUID(), reward_description: formDesc, tokens_required: tokens, is_active: formActive },
        ])
      } else {
        setOptions((prev) =>
          prev.map((o) =>
            o.id === editing
              ? { ...o, reward_description: formDesc, tokens_required: tokens, is_active: formActive }
              : o
          )
        )
      }
    })
  }

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-800">兌換選項管理</h3>
        <button
          onClick={startNew}
          className="text-sm text-[#4A90E2] font-medium"
        >
          + 新增
        </button>
      </div>

      <div className="space-y-2">
        {options.map((opt) => (
          <div key={opt.id}>
            {editing === opt.id ? (
              <div className="border border-[#4A90E2]/40 rounded-xl p-3 space-y-2">
                <input
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="兌換描述"
                  className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:border-[#4A90E2] outline-none"
                />
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    value={formTokens}
                    onChange={(e) => setFormTokens(e.target.value)}
                    placeholder="所需 Tokens"
                    className="flex-1 text-sm px-3 py-2 border border-gray-200 rounded-lg focus:border-[#4A90E2] outline-none"
                  />
                  <label className="flex items-center gap-1.5 text-sm text-gray-600">
                    <input
                      type="checkbox"
                      checked={formActive}
                      onChange={(e) => setFormActive(e.target.checked)}
                      className="accent-[#4A90E2]"
                    />
                    啟用
                  </label>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    disabled={isPending}
                    className="flex-1 h-8 text-xs font-medium bg-[#4A90E2] text-white rounded-lg"
                  >
                    儲存
                  </button>
                  <button
                    onClick={() => setEditing(null)}
                    className="flex-1 h-8 text-xs font-medium bg-gray-100 text-gray-600 rounded-lg"
                  >
                    取消
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between py-2 px-1">
                <div>
                  <span className={`text-sm font-medium ${opt.is_active ? 'text-gray-800' : 'text-gray-400 line-through'}`}>
                    {opt.reward_description}
                  </span>
                  <span className="text-xs text-[#4A90E2] ml-2">{opt.tokens_required} T</span>
                  {!opt.is_active && (
                    <span className="text-xs text-gray-400 ml-1">(已停用)</span>
                  )}
                </div>
                <button
                  onClick={() => startEdit(opt)}
                  className="text-xs text-gray-400 underline"
                >
                  編輯
                </button>
              </div>
            )}
          </div>
        ))}

        {editing === 'new' && (
          <div className="border border-[#4A90E2]/40 rounded-xl p-3 space-y-2">
            <input
              value={formDesc}
              onChange={(e) => setFormDesc(e.target.value)}
              placeholder="兌換描述"
              className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:border-[#4A90E2] outline-none"
            />
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={formTokens}
                onChange={(e) => setFormTokens(e.target.value)}
                placeholder="所需 Tokens"
                className="flex-1 text-sm px-3 py-2 border border-gray-200 rounded-lg focus:border-[#4A90E2] outline-none"
              />
              <label className="flex items-center gap-1.5 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={formActive}
                  onChange={(e) => setFormActive(e.target.checked)}
                  className="accent-[#4A90E2]"
                />
                啟用
              </label>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={isPending}
                className="flex-1 h-8 text-xs font-medium bg-[#4A90E2] text-white rounded-lg"
              >
                儲存
              </button>
              <button
                onClick={() => setEditing(null)}
                className="flex-1 h-8 text-xs font-medium bg-gray-100 text-gray-600 rounded-lg"
              >
                取消
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
