import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, LocateFixed, MapPin } from 'lucide-react'

export function DeliveryLocationPage(){
  const navigate=useNavigate()
  const [status,setStatus]=useState('idle')
  const [location,setLocation]=useState(null)
  const [error,setError]=useState('')

  const detect=()=>{
    if(!navigator.geolocation){setStatus('error');setError('Location is not supported by this browser.');return}
    setStatus('loading');setError('')
    navigator.geolocation.getCurrentPosition(async({coords})=>{
      const {latitude,longitude}=coords
      try{
        const response=await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`,{headers:{Accept:'application/json'}})
        if(!response.ok)throw new Error('Reverse geocoding failed')
        const data=await response.json()
        const address=data.address||{}
        const name=address.city||address.town||address.municipality||address.village||address.county||'Current location'
        const state=address.state||''
        const value={latitude,longitude,name,state,label:state?`${name}, ${state}`:name}
        setLocation(value)
        localStorage.setItem('bowlDeliveryLocation',JSON.stringify(value))
        setStatus('success')
      }catch{
        const value={latitude,longitude,name:'Current location',state:'',label:'Current location'}
        setLocation(value)
        localStorage.setItem('bowlDeliveryLocation',JSON.stringify(value))
        setStatus('success')
        setError('GPS location found, but the place name could not be resolved.')
      }
    },err=>{
      setStatus('error')
      setError(err.code===1?'Location permission was denied. Please allow location access and try again.':'Could not detect your current location. Please try again.')
    },{enableHighAccuracy:true,timeout:12000,maximumAge:60000})
  }

  return <div className="mobile-prototype-frame"><div className="mobile-app-shell"><main className="auth-screen mobile-route-content"><div className="auth-card">
    <button type="button" className="auth-back" onClick={()=>navigate('/delivery/verification')}><ArrowLeft/> Back</button>
    <div className="auth-brand">🥣<span>GOLDEN FOOD BOWL</span></div>
    <span className="eyebrow">CURRENT LOCATION</span><h1>Share your delivery location</h1>
    <p>Your current device location helps Bowl show the correct delivery area. This prototype does not continuously track GPS here.</p>
    <div className="location-card"><MapPin/><div><strong>{location?.label||'Current device location'}</strong><span>{status==='loading'?'Using your device GPS…':status==='success'?'Location detected successfully':'Allow location access to continue.'}</span></div></div>
    {error&&<p className="auth-error">{error}</p>}
    {status!=='success'?<button className="auth-primary" type="button" onClick={detect} disabled={status==='loading'}><LocateFixed/> {status==='loading'?'Detecting location…':'Use my current location'}</button>:<><div className="auth-summary"><span>Detected area <b>{location.label}</b></span><span>Coordinates <b>{location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}</b></span><span>Location sharing <b>Ready</b></span></div><button className="auth-primary" type="button" onClick={()=>navigate('/delivery/onboarding-fee/payment')}>Continue to onboarding fee</button></>}
    <p className="auth-switch-text">Your browser/device will ask for location permission the first time.</p>
  </div></main></div></div>
}
