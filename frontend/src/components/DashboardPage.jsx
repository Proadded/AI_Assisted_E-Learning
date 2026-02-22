import React from 'react'
import useAuthStore from '../store/useAuthStore'

const DashboardPage = () => {
    const { authUser } = useAuthStore();
    return (
        <div>DashboardPage</div>
    )
}

export default DashboardPage
