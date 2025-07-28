import React from 'react';

const SponsorBanner = ({ 
  position = 'top', 
  size = 'medium', 
  isPremium = false,
  sponsor = null 
}) => {
  // If user is premium, don't show banners
  if (isPremium) {
    return null;
  }

  // Default sponsor if none provided
  const defaultSponsor = sponsor || {
    name: 'GearX Pro',
    logo: '🏆',
    message: 'Get 20% off premium gear!',
    cta: 'Shop Now',
    link: '#'
  };

  const getBannerStyles = () => {
    const baseStyles = {
      border: '2px solid #333',
      background: 'white',
      padding: '10px',
      margin: '10px 0',
      textAlign: 'center',
      position: 'relative',
      overflow: 'hidden'
    };

    switch (size) {
      case 'small':
        return {
          ...baseStyles,
          height: '60px',
          fontSize: '12px'
        };
      case 'medium':
        return {
          ...baseStyles,
          height: '90px',
          fontSize: '14px'
        };
      case 'large':
        return {
          ...baseStyles,
          height: '120px',
          fontSize: '16px'
        };
      case 'wide':
        return {
          ...baseStyles,
          height: '80px',
          fontSize: '14px',
          width: '100%'
        };
      case 'sidebar':
        return {
          ...baseStyles,
          height: '250px',
          width: '200px',
          fontSize: '12px',
          writingMode: 'vertical-rl',
          textOrientation: 'mixed'
        };
      default:
        return baseStyles;
    }
  };

  const getBannerContent = () => {
    switch (size) {
      case 'small':
        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <span style={{ fontSize: '20px', marginRight: '8px' }}>{defaultSponsor.logo}</span>
            <span style={{ fontWeight: 'bold' }}>{defaultSponsor.message}</span>
          </div>
        );
      
      case 'medium':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <div style={{ fontSize: '24px', marginBottom: '5px' }}>{defaultSponsor.logo}</div>
            <div style={{ fontWeight: 'bold', marginBottom: '3px' }}>{defaultSponsor.name}</div>
            <div style={{ fontSize: '12px', marginBottom: '5px' }}>{defaultSponsor.message}</div>
            <button style={{
              border: '1px solid #333',
              background: 'white',
              padding: '3px 8px',
              fontSize: '11px',
              cursor: 'pointer'
            }}>
              {defaultSponsor.cta}
            </button>
          </div>
        );
      
      case 'large':
        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '100%', padding: '0 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ fontSize: '32px', marginRight: '15px' }}>{defaultSponsor.logo}</span>
              <div>
                <div style={{ fontWeight: 'bold', fontSize: '18px', marginBottom: '5px' }}>{defaultSponsor.name}</div>
                <div style={{ fontSize: '14px' }}>{defaultSponsor.message}</div>
              </div>
            </div>
            <button style={{
              border: '2px solid #333',
              background: 'white',
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}>
              {defaultSponsor.cta}
            </button>
          </div>
        );
      
      case 'wide':
        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '100%', padding: '0 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ fontSize: '24px', marginRight: '12px' }}>{defaultSponsor.logo}</span>
              <div>
                <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '3px' }}>{defaultSponsor.name}</div>
                <div style={{ fontSize: '12px' }}>{defaultSponsor.message}</div>
              </div>
            </div>
            <button style={{
              border: '1px solid #333',
              background: 'white',
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}>
              {defaultSponsor.cta}
            </button>
          </div>
        );
      
      case 'sidebar':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <div style={{ fontSize: '20px', marginBottom: '10px' }}>{defaultSponsor.logo}</div>
            <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>{defaultSponsor.name}</div>
            <div style={{ fontSize: '10px', marginBottom: '8px', textAlign: 'center' }}>{defaultSponsor.message}</div>
            <button style={{
              border: '1px solid #333',
              background: 'white',
              padding: '4px 8px',
              fontSize: '10px',
              cursor: 'pointer'
            }}>
              {defaultSponsor.cta}
            </button>
          </div>
        );
      
      default:
        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <span style={{ fontSize: '16px' }}>{defaultSponsor.message}</span>
          </div>
        );
    }
  };

  return (
    <div 
      className="sponsor-banner"
      style={getBannerStyles()}
      data-position={position}
      data-size={size}
    >
      {getBannerContent()}
      <div style={{
        position: 'absolute',
        top: '2px',
        right: '2px',
        fontSize: '8px',
        color: '#999',
        background: '#f0f0f0',
        padding: '1px 3px',
        border: '1px solid #ccc'
      }}>
        AD
      </div>
    </div>
  );
};

export default SponsorBanner; 