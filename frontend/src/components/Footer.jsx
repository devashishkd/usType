import React from 'react'

const Footer = () => {
  return (
     <footer style={{ 
          marginTop: '4rem', 
          paddingTop: '2rem',
          paddingBottom: '2rem',
          borderTop: '2px solid var(--sub-alt-color)',
          textAlign: 'center'
        }}>
          <div className="text-dim" style={{ fontSize: '0.875rem' }}>
            <span>&copy; Devashish Productions. All Rights Reserved</span>
          </div>
        </footer>
  )
}

export default Footer