import Home from './pages/Home.jsx'
import React from 'react'
import { BrowserRouter } from 'react-router-dom'
import Layout from './pages/Layout.jsx'
import RemoveBackground from './pages/RemoveBackground.jsx'
import RemoveObjects from './pages/RemoveObjects.jsx'
import Community from './pages/Community.jsx'
import ReviewResume from './pages/ReviewResume.jsx'
import GenerateImages from './pages/GenerateImages.jsx'
import Dashboard from './pages/Dashboard.jsx'
import WriteArticle from './pages/WriteArticle.jsx'
import BlogTitles from './pages/BlogTitles.jsx'
import { Routes, Route } from 'react-router-dom'
import {Toaster} from 'react-hot-toast'

const App = () => {


  return (
    <div>
    <Toaster/>
      <Routes>
        <Route path='/' element={<Home />} />
          <Route path='/ai' element={<Layout />} >
          <Route index element={<Dashboard />} />
          <Route path='write-article' element={<WriteArticle />} />
          <Route path='blog-titles' element={<BlogTitles />} />
          <Route path='remove-background' element={<RemoveBackground />} />
          <Route path='remove-object' element={<RemoveObjects />} />
          <Route path='community' element={<Community />} />
          <Route path='review-resume' element={<ReviewResume />} />
          <Route path='generate-images' element={<GenerateImages />} />
        </Route>
      </Routes>
    </div>
  )
}

export default App
