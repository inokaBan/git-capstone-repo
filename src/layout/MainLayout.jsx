import { Outlet } from 'react-router-dom'
import Navbar from '../components/Navbar'

const MainLayout = () => {
  return <>
    <Navbar />
    <div className="pt-16">
      <Outlet />
    </div>
  </>
}

export default MainLayout
