'use client'
import React from 'react'
import AuthGuard from '../lib/authGuard'
import Layout from '../components/common/layout'

const Dashboard = () => {
  return (
    <AuthGuard>
      <Layout>
        <section className="mb-8">
          <h1 className="text-3xl font-bold text-cyan-400">Welcome to Drug-Free Compliance</h1>
          <p className="mt-2 text-gray-400 text-lg">
            Easier Hiring Decisions. Safer Workplaces. Trusted Since 1994.
          </p>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <DashboardCard
            title="Drug Testing"
            description="Manage 5-panel, 10-panel, and expanded opiate tests."
            icon="🧪"
          />
          <DashboardCard
            title="Alcohol Testing"
            description="Track blood alcohol screenings and compliance logs."
            icon="🍷"
          />
          <DashboardCard
            title="Background Checks"
            description="Access criminal, motor vehicle, and social media reports."
            icon="🔍"
          />
          <DashboardCard
            title="Workplace Compliance"
            description="Administer Federal Drug-Free Workplace Act programs."
            icon="🏢"
          />
          <DashboardCard
            title="Insurance Benefits"
            description="Monitor Workers’ Comp discounts and safety incentives."
            icon="💼"
          />
          <DashboardCard
            title="Verification Services"
            description="Verify employment, education, and professional references."
            icon="📄"
          />
        </section>
      </Layout>
    </AuthGuard>
  )
}

const DashboardCard = ({ title, description, icon }) => (
  <div className="bg-gray-800 rounded-xl p-6 hover:shadow-lg transition-shadow border border-gray-700">
    <div className="flex items-center gap-4 mb-4">
      <span className="text-3xl">{icon}</span>
      <h3 className="text-xl font-semibold text-white">{title}</h3>
    </div>
    <p className="text-gray-400">{description}</p>
  </div>
)

export default Dashboard