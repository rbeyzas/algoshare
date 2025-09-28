// src/components/Home.tsx
import React, { useState } from 'react'
import { useWallet } from '@txnlab/use-wallet-react'

// Frontend modals
import ConnectWallet from './components/ConnectWallet'
import Transact from './components/Transact'
import NFTmint from './components/NFTmint'
import Tokenmint from './components/Tokenmint'

// Smart contract demo modal (backend app calls)
import AppCalls from './components/AppCalls'

interface HomeProps {}

const Home: React.FC<HomeProps> = () => {
  const [openWalletModal, setOpenWalletModal] = useState<boolean>(false)
  const [openPaymentModal, setOpenPaymentModal] = useState<boolean>(false)
  const [openMintModal, setOpenMintModal] = useState<boolean>(false)
  const [openTokenModal, setOpenTokenModal] = useState<boolean>(false)
  const [openAppCallsModal, setOpenAppCallsModal] = useState<boolean>(false)

  const { activeAddress } = useWallet()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center px-4">
      <div className="bg-white shadow-2xl rounded-3xl p-10 text-center max-w-2xl w-full border border-gray-100">
        <div className="mb-8">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <span className="text-3xl">🏢</span>
          </div>
          <h1 className="text-5xl font-bold text-gray-800 mb-4">AlgoShare</h1>
          <h2 className="text-2xl font-semibold text-gray-600 mb-6">Automation Platform</h2>
          <p className="text-lg text-gray-600 leading-relaxed">
            Comprehensive automation solution designed for modern companies. Secure payroll management, file transfer, and team
            communication powered by blockchain technology.
          </p>
        </div>

        <div className="space-y-4">
          <button
            className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
            onClick={() => setOpenWalletModal(true)}
          >
            {activeAddress ? '✅ Wallet Connected' : '🔗 Connect Wallet'}
          </button>

          {activeAddress && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
              <button
                className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-4 rounded-xl font-semibold hover:from-green-600 hover:to-emerald-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                onClick={() => setOpenPaymentModal(true)}
              >
                💰 Payroll Payment
              </button>

              <button
                className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-6 py-4 rounded-xl font-semibold hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                onClick={() => setOpenMintModal(true)}
              >
                📁 File Transfer
              </button>

              <button
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-4 rounded-xl font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                onClick={() => setOpenTokenModal(true)}
              >
                💬 Messaging
              </button>

              <button
                className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-4 rounded-xl font-semibold hover:from-orange-600 hover:to-red-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                onClick={() => setOpenAppCallsModal(true)}
              >
                ⚙️ System Management
              </button>

              <button
                className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-6 py-4 rounded-xl font-semibold hover:from-indigo-600 hover:to-purple-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                onClick={() => setOpenAppCallsModal(true)}
              >
                📊 Analytics Dashboard
              </button>
            </div>
          )}
        </div>

        {/* Modals */}
        <ConnectWallet openModal={openWalletModal} closeModal={() => setOpenWalletModal(false)} />

        <Transact openModal={openPaymentModal} setModalState={setOpenPaymentModal} />
        <NFTmint openModal={openMintModal} setModalState={setOpenMintModal} />
        <Tokenmint openModal={openTokenModal} setModalState={setOpenTokenModal} />

        <AppCalls openModal={openAppCallsModal} setModalState={setOpenAppCallsModal} />
      </div>
    </div>
  )
}

export default Home
