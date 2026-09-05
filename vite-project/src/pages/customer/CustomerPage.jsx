import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, Bell, Search, MapPin, Star, Plus, CheckCircle2, CreditCard, LogOut, Minus, Trash2, Calendar, Clock, ShieldCheck, Loader2, Smartphone, Building2, Wallet, Banknote } from 'lucide-react'
import { branches } from '../../data/mockData'
import { usePrototypeContext } from '../../context/PrototypeContext'
import { orderApi } from '../../services/api/orderApi'
import { addressApi } from '../../services/api/addressApi'
import { NotificationPanel } from '../../components/notifications/NotificationPanel'
import { openRazorpayCheckout, RAZORPAY_KEY_ID } from '../../services/razorpay'
import { authStorage } from '../../services/storage/authStorage'


const titleMap={home:'Good food. Better bowls.',search:'Search food',orders:'My orders',profile:'My account',categories:'Categories',cart:'Your cart',checkout:'Checkout',payment:'Payment','order-success':'Order confirmed',track:'Track order',notifications:'Notifications',offers:'Golden Offers & Deals'}
const CART_KEY='goldbowl_cart',CHECKOUT_KEY='goldbowl_checkout'
const LOGO_URL='https://res.cloudinary.com/dwmjz9csc/image/upload/v1787120716/image-removebg-preview_e1wfil.png'
const readCart=()=>{try{return JSON.parse(localStorage.getItem(CART_KEY))||[]}catch{return[]}}
const saveCart=items=>localStorage.setItem(CART_KEY,JSON.stringify(items))
const money=v=>`₹${Math.round(v)}`
function FoodImage({ src, alt, className = '', style = {} }) {
  const fallback = 'https://res.cloudinary.com/dwmjz9csc/image/upload/v1787120716/image-removebg-preview_e1wfil.png'
  const [imgSrc, setImgSrc] = React.useState(src || fallback)

  React.useEffect(() => {
    if (src) setImgSrc(src)
  }, [src])

  return (
    <img
      className={className}
      style={style}
      src={imgSrc || fallback}
      alt={alt || 'Golden Food Bowl product'}
      loading="lazy"
      onError={() => setImgSrc(fallback)}
    />
  )
}

export function CustomerPage(){const {pathname}=useLocation();const path=pathname.replace('/customer/','')||'home';if(path.startsWith('product/'))return <Product id={path.split('/')[1]}/>;if(path.startsWith('orders/'))return <OrderDetail id={path.split('/')[1]}/>;if(path.startsWith('track/'))return <Tracking id={path.split('/')[1]}/>;return <Page title={titleMap[path]||'Golden Food Bowl'}>{path==='home'&&<Home/>}{path==='search'&&<SearchPage/>}{path==='categories'&&<Categories/>}{path==='orders'&&<Orders/>}{path==='offers'&&<OffersView/>}{path==='profile'&&<Profile/>}{path==='cart'&&<Cart/>}{path==='checkout'&&<Checkout/>}{path==='payment'&&<Payment/>}{path==='order-success'&&<Success/>}{path==='notifications'&&<CustomerNotifications/>}</Page>}

function OffersView() {
  const [copiedCode, setCopiedCode] = React.useState('')
  const offersList = [
    { code: 'GOLDEN50', discount: '50% OFF', subtitle: 'Up to ₹120 on all signature bowls', minSpend: 'Min spend ₹199', validTill: 'Valid today' },
    { code: 'BUTTER100', discount: 'FLAT ₹100 OFF', subtitle: 'On rich rice meals & feast bowls', minSpend: 'Min spend ₹299', validTill: 'Ends in 3h 15m' },
    { code: 'FREEDEL', discount: 'FREE DELIVERY', subtitle: 'Zero delivery fee on all orders', minSpend: 'No minimum order', validTill: 'Valid all week' },
    { code: 'BOGOFRUIT', discount: 'BUY 1 GET 1', subtitle: 'Buy 1 Fresh Shake get 1 Free', minSpend: 'Drinks category', validTill: 'Limited stock' },
  ]
  const copyCoupon = (code) => {
    try { navigator.clipboard?.writeText(code) } catch (err) { if (err) return }
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(''), 2500)
  }
  return (
    <div className="offers-container">
      <div className="offers-hero-card">
        <span className="offer-tag">MEGA SAVINGS FESTIVAL</span>
        <h2>Golden Offers & Promo Codes</h2>
        <p>Save up to 50% on your favourite bowls and meals today!</p>
      </div>
      <div className="offers-list">
        {offersList.map((item) => (
          <div key={item.code} className="offer-card">
            <div className="offer-card-head">
              <span className="offer-badge">{item.discount}</span>
              <small>{item.validTill}</small>
            </div>
            <h3>{item.subtitle}</h3>
            <span className="offer-min">{item.minSpend}</span>
            <div className="offer-code-bar">
              <div className="code-box">
                <small>COUPON</small>
                <strong>{item.code}</strong>
              </div>
              <button 
                type="button" 
                className={`copy-code-btn ${copiedCode === item.code ? 'copied' : ''}`}
                onClick={() => copyCoupon(item.code)}
              >
                {copiedCode === item.code ? 'COPIED! ✓' : 'COPY CODE'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
function Page({title,children}){const isHome=title===titleMap.home;return <><header className={`route-mobile-header ${isHome?'home-header':''}`}>{isHome?<Link to="/customer/home" className="customer-header-logo" aria-label="Golden Food Bowl home"><img src={LOGO_URL} alt="Golden Food Bowl"/></Link>:<Link to="/customer/home"><ArrowLeft/></Link>}<strong>{isHome?'':title}</strong><Link to="/customer/notifications" aria-label="Notifications"><Bell size={19}/></Link></header><div className="route-mobile-body">{children}</div></>}
function addProduct(p){const cart=readCart(),existing=cart.find(x=>x.productId===p.id);saveCart(existing?cart.map(x=>x.productId===p.id?{...x,quantity:x.quantity+1}:x):[...cart,{productId:p.id,quantity:1}])}
function ProductCard({p}){return <article className="route-product"><Link to={`/customer/product/${p.id}`} className="route-food-image"><FoodImage src={p.image} alt={p.name}/></Link><div><span className="route-rating"><Star size={12} fill="currentColor"/> {p.rating}</span><h3>{p.name}</h3><small>{p.portion} • {p.calories} kcal</small><div className="route-price"><strong>₹{p.price}</strong><button type="button" onClick={()=>{addProduct(p);window.location.href='/customer/cart'}}><Plus size={16}/></button></div></div></article>}
function Home(){
  const { products, categories } = usePrototypeContext()
  const activeProducts = products.filter(p => p.available !== false)
  return <><div className="customer-location"><MapPin/><span>Delivering to <strong>Bengaluru</strong></span></div><section className="route-hero"><span>GOLDEN MOMENTS</span><h1>Good food.<br/><em>Better bowls.</em></h1><p>Freshly made, beautifully delivered.</p><Link to="/customer/categories">Explore Menu</Link></section><Link className="route-search" to="/customer/search"><Search/>Search bowls, meals and more</Link><h2>Menu</h2><div className="route-category-row">{categories.map(c=><Link to={`/customer/search?category=${c.id}`} key={c.id}><span>{c.icon || '🍲'}</span>{c.name}</Link>)}</div><h2>Popular at Bowl</h2><div className="route-products">{activeProducts.slice(0,8).map(p=><ProductCard key={p.id} p={p}/>)}</div></>
}
function SearchPage(){
  const { products, categories } = usePrototypeContext()
  const activeProducts = products.filter(p => p.available !== false)
  const {search}=useLocation()
  const params=new URLSearchParams(search)
  const selected=params.get('category')||'all'
  const [query,setQuery]=React.useState('')
  const [sort,setSort]=React.useState('popular')
  const [focused,setFocused]=React.useState(false)

  const filtered=activeProducts.filter(p=>
    (selected==='all'||p.category===selected)&&
    (!query.trim()||`${p.name} ${p.description||''} ${p.category}`.toLowerCase().includes(query.toLowerCase()))
  )

  const sorted=[...filtered].sort((a,b)=>{
    if(sort==='price_asc') return a.price-b.price
    if(sort==='price_desc') return b.price-a.price
    if(sort==='rating') return (b.rating||0)-(a.rating||0)
    return (b.rating||0)-(a.rating||0)
  })

  const allChips=[{id:'all',name:'All',icon:'🍽️'},...categories]


  return (
    <>
      {/* ── Sticky Search Bar ── */}
      <div style={{
        position:'sticky',top:0,zIndex:30,
        background:'#fff',
        padding:'10px 0 8px',
        marginBottom:0,
        borderBottom:'1px solid #f0e9dc'
      }}>
        <div style={{
          display:'flex',alignItems:'center',gap:10,
          background:focused?'#fffdf7':'#f7f4ee',
          border:`1.5px solid ${focused?'#dfa500':'transparent'}`,
          borderRadius:16,
          padding:'10px 14px',
          transition:'all .2s ease',
          boxShadow:focused?'0 0 0 3px rgba(223,165,0,.1)':'none'
        }}>
          <Search size={18} style={{color:focused?'#dfa500':'#a09890',flexShrink:0}}/>
          <input
            value={query}
            onChange={e=>setQuery(e.target.value)}
            onFocus={()=>setFocused(true)}
            onBlur={()=>setFocused(false)}
            placeholder="Search bowls, meals, drinks…"
            autoFocus
            style={{
              flex:1,border:0,outline:0,background:'transparent',
              fontSize:14,color:'#1c1917',fontWeight:500
            }}
          />
          {query&&(
            <button
              type="button"
              onClick={()=>setQuery('')}
              style={{background:'none',border:0,cursor:'pointer',color:'#a09890',padding:0,display:'flex'}}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* ── Category Filter Chips ── */}
      <div style={{
        display:'flex',gap:8,overflowX:'auto',
        padding:'12px 0 4px',scrollbarWidth:'none'
      }}>
        {allChips.map(c=>{
          const isActive=c.id===selected
          return (
            <Link
              key={c.id}
              to={c.id==='all'?'/customer/search':`/customer/search?category=${c.id}`}
              style={{
                display:'flex',alignItems:'center',gap:6,
                padding:'7px 14px',borderRadius:22,whiteSpace:'nowrap',
                textDecoration:'none',fontSize:12,fontWeight:700,
                flexShrink:0,
                background:isActive?'#1c1917':'#f7f4ee',
                color:isActive?'#f5c518':'#44403c',
                border:`1.5px solid ${isActive?'#1c1917':'#ede8df'}`,
                boxShadow:isActive?'0 2px 8px rgba(28,25,23,.18)':'none',
                transition:'all .15s ease'
              }}
            >
              <span style={{fontSize:15}}>{c.icon||'🍽️'}</span>
              {c.name}
            </Link>
          )
        })}
      </div>

      {/* ── Results Header ── */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',margin:'14px 0 10px'}}>
        <div>
          <span style={{fontSize:11,color:'#a09890',fontWeight:600}}>
            {sorted.length} {sorted.length===1?'result':'results'}
            {selected!=='all'&&categories.find(c=>c.id===selected)
              ? ` in ${categories.find(c=>c.id===selected).name}`
              : query?` for "${query}"`:''
            }
          </span>
        </div>
        <select
          value={sort}
          onChange={e=>setSort(e.target.value)}
          style={{
            fontSize:11,fontWeight:700,color:'#1c1917',
            border:'1px solid #ede8df',borderRadius:10,
            padding:'5px 10px',background:'#f7f4ee',
            outline:0,cursor:'pointer'
          }}
        >
          <option value="popular">⭐ Popular</option>
          <option value="rating">🔝 Top Rated</option>
          <option value="price_asc">💰 Price: Low</option>
          <option value="price_desc">💎 Price: High</option>
        </select>
      </div>

      {/* ── Product Grid ── */}
      {sorted.length ? (
        <div style={{
          display:'grid',
          gridTemplateColumns:'1fr 1fr',
          gap:12,
          paddingBottom:24
        }}>
          {sorted.map(p=>(
            <article key={p.id} style={{
              border:'1px solid #eee5d8',borderRadius:18,
              overflow:'hidden',background:'#fff',
              boxShadow:'0 2px 10px rgba(0,0,0,.04)',
              display:'flex',flexDirection:'column'
            }}>
              <Link to={`/customer/product/${p.id}`} style={{
                display:'block',height:110,background:'#f8f2e7',
                overflow:'hidden',textDecoration:'none',position:'relative'
              }}>
                <FoodImage
                  src={p.image}
                  alt={p.name}
                  style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}}
                />
                {p.rating&&p.rating>=4.5&&(
                  <span style={{
                    position:'absolute',top:8,left:8,
                    background:'#16a34a',color:'#fff',
                    fontSize:8,fontWeight:800,padding:'2px 6px',
                    borderRadius:6,letterSpacing:.5
                  }}>BESTSELLER</span>
                )}
              </Link>
              <div style={{padding:'10px 10px 12px',flex:1,display:'flex',flexDirection:'column',gap:4}}>
                <div style={{display:'flex',alignItems:'center',gap:4}}>
                  <Star size={10} fill="#f5c518" stroke="none"/>
                  <span style={{fontSize:10,fontWeight:700,color:'#78716c'}}>{p.rating||'4.5'}</span>
                </div>
                <h3 style={{
                  fontSize:12.5,fontWeight:800,color:'#1c1917',
                  margin:0,lineHeight:1.3,
                  display:'-webkit-box',WebkitLineClamp:2,
                  WebkitBoxOrient:'vertical',overflow:'hidden'
                }}>{p.name}</h3>
                <small style={{fontSize:9.5,color:'#a09890',fontWeight:500}}>
                  {p.portion} • {p.calories} kcal
                </small>
                <div style={{
                  display:'flex',alignItems:'center',
                  justifyContent:'space-between',marginTop:'auto',paddingTop:6
                }}>
                  <strong style={{fontSize:14,fontWeight:900,color:'#1c1917'}}>₹{p.price}</strong>
                  <button
                    type="button"
                    onClick={()=>{addProduct(p);window.location.href='/customer/cart'}}
                    style={{
                      width:28,height:28,border:0,borderRadius:9,
                      background:'#1c1917',color:'#f5c518',
                      display:'grid',placeItems:'center',cursor:'pointer',
                      flexShrink:0,boxShadow:'0 2px 6px rgba(28,25,23,.2)'
                    }}
                  >
                    <Plus size={15}/>
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div style={{
          textAlign:'center',padding:'48px 24px',
          display:'flex',flexDirection:'column',alignItems:'center',gap:10
        }}>
          <span style={{fontSize:52}}>🔍</span>
          <strong style={{fontSize:16,color:'#1c1917'}}>No dishes found</strong>
          <p style={{fontSize:12,color:'#a09890',margin:0}}>
            {query?`No results for "${query}". `:''}
            Try another category or search term.
          </p>
          <Link
            to="/customer/search"
            style={{
              marginTop:8,padding:'9px 18px',borderRadius:12,
              background:'#1c1917',color:'#f5c518',
              textDecoration:'none',fontSize:12,fontWeight:800
            }}
          >
            View All Menu →
          </Link>
        </div>
      )}
    </>
  )
}
function Categories(){const {categories}=usePrototypeContext();return <><p>Choose a menu category to see only its dishes.</p><div className="route-category-grid">{categories.map(c=><Link to={`/customer/search?category=${c.id}`} key={c.id}><span>{c.icon || '🍲'}</span><strong>{c.name}</strong><small>View {c.name}</small></Link>)}</div></>}
function Product({id}){const {products}=usePrototypeContext();const p=products.find(x=>String(x.id)===id)||products[0];if(!p)return null;return <Page title={p.name}><div className="route-detail-image"><FoodImage src={p.image} alt={p.name}/></div><span className="route-pill">{p.available!==false?'Available':'Currently Unavailable'}</span><h1>{p.name}</h1><div className="route-rating"><Star size={14} fill="currentColor"/> {p.rating||4.5} rating</div><p>{p.description||'Deliciously prepared food bowl.'}</p><div className="route-nutrition"><b>{p.portion||'450g'}<small>Portion</small></b><b>{p.calories||650}<small>Calories</small></b><b>{p.ingredients?.length||4}<small>Ingredients</small></b></div>{p.ingredients&&p.ingredients.length>0&&<><h2>Ingredients</h2><div className="ingredient-chips">{p.ingredients.map(i=><span key={i}>{i}</span>)}</div></>}<button type="button" className="route-primary" onClick={()=>{addProduct(p);window.location.href='/customer/cart'}}>Add to Cart • ₹{p.price}</button></Page>}
function Cart(){const navigate=useNavigate();const {products,deliverySettings}=usePrototypeContext();const [items,setItems]=React.useState(readCart);const detailed=items.map(i=>({...i,product:products.find(p=>p.id===i.productId)})).filter(i=>i.product);const update=(id,d)=>{const next=items.map(i=>i.productId===id?{...i,quantity:i.quantity+d}:i).filter(i=>i.quantity>0);setItems(next);saveCart(next)};const customerDeliveryFee=Number(deliverySettings?.customerDeliveryFee??0);const subtotal=detailed.reduce((s,i)=>s+i.product.price*i.quantity,0),delivery=subtotal?customerDeliveryFee:0,taxes=Math.round(subtotal*.05),total=subtotal+delivery+taxes;if(!detailed.length)return <div className="route-success"><h1>Your cart is empty</h1><p>Choose dishes from the menu to continue.</p><Link className="route-primary" to="/customer/categories">Explore Menu</Link></div>;return <><div>{detailed.map(i=><div className="route-cart-item" key={i.productId}><span className="route-cart-image"><FoodImage src={i.product.image} alt={i.product.name}/></span><div><strong>{i.product.name}</strong><small>{money(i.product.price)} • Qty {i.quantity}</small><div style={{display:'flex',gap:6,marginTop:8}}><button type="button" onClick={()=>update(i.productId,-1)}><Minus size={13}/></button><button type="button" onClick={()=>update(i.productId,1)}><Plus size={13}/></button><button type="button" onClick={()=>update(i.productId,-i.quantity)}><Trash2 size={13}/></button></div></div><strong>{money(i.product.price*i.quantity)}</strong></div>)}</div><div className="route-summary"><span>Subtotal <b>{money(subtotal)}</b></span><span>Delivery <b style={{color:delivery===0?'#16a34a':'inherit'}}>{delivery===0?'FREE (₹0)':money(delivery)}</b></span><span>Taxes <b>{money(taxes)}</b></span><hr/><span>Total <b>{money(total)}</b></span></div><button type="button" className="route-primary" onClick={()=>{localStorage.setItem(CHECKOUT_KEY,JSON.stringify({items,subtotal,delivery,taxes,total}));navigate('/customer/checkout')}}>Proceed to Checkout</button></>}

function Checkout(){
  const navigate=useNavigate();
  const [type,setType]=React.useState('Delivery');
  const [branch,setBranch]=React.useState(branches[0]?.id||1);
  const [address,setAddress]=React.useState(null);
  const [addresses, setAddresses] = React.useState([]);
  
  const customerUser = authStorage.getCustomerUser() || {};
  
  React.useEffect(() => {
    if (customerUser?.id) {
      addressApi.getAddresses(customerUser.id).then(res => {
        if (res?.data?.length) {
          setAddresses(res.data);
          const defaultAddr = res.data.find(a => a.isDefault) || res.data[0];
          setAddress(defaultAddr);
        }
      }).catch(() => {});
    }
  }, []);

  const cart=(()=>{try{return JSON.parse(localStorage.getItem(CHECKOUT_KEY))||null}catch{return null}})();
  if(!cart)return <div className="route-success"><h1>Your checkout is empty</h1><Link className="route-primary" to="/customer/cart">Back to Cart</Link></div>;
  const selectedBranch=branches.find(b=>b.id===branch)||branches[0];
  
  const handleAddressChange = () => {
    if (!addresses.length) return;
    const currentIndex = addresses.findIndex(a => a.id === address?.id);
    const nextIndex = (currentIndex + 1) % addresses.length;
    setAddress(addresses[nextIndex]);
  };

  return <><h2>Order type</h2><div className="route-segment"><button type="button" className={type==='Delivery'?'active':''} onClick={()=>setType('Delivery')}>🚚 Delivery</button><button type="button" className={type==='Pickup'?'active':''} onClick={()=>setType('Pickup')}>🏪 Pickup</button></div><h2>Branch</h2>{branches.map(b=><button type="button" className="route-card" key={b.id} onClick={()=>setBranch(b.id)} style={{width:'100%',textAlign:'left',borderColor:b.id===branch?'#b4811d':undefined}}><span>🏪</span><span>{b.name}<small>{b.distance}</small></span><b>{b.id===branch?'✓':'›'}</b></button>)}{type==='Delivery'&&<><h2>Delivery address</h2>
  {address ? (
    <button type="button" className="route-card" onClick={handleAddressChange} style={{width:'100%',textAlign:'left'}}><MapPin/><span>{address.type}<small>{address.address}</small></span><b>Change</b></button>
  ) : (
    <div style={{padding: '12px', background: '#fff', border: '1px solid #eee4d2', borderRadius: '12px', fontSize: '12px', color: '#78716c'}}>No saved addresses. Please add one in your profile.</div>
  )}
  </>}<h2>Order total</h2><div className="route-summary"><span>Total <b>{money(cart.total)}</b></span></div><button type="button" className="route-primary" onClick={()=>{localStorage.setItem(CHECKOUT_KEY,JSON.stringify({...cart,type,branch:selectedBranch.id,address: address?.address, addressType: address?.type}));navigate('/customer/payment')}}>Continue to Payment</button></>}
function Payment() {
  const navigate = useNavigate();
  const { branches: storeBranches } = usePrototypeContext();
  const [method, setMethod] = React.useState('Razorpay');
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [paymentNotice, setPaymentNotice] = React.useState(null);

  const cart = (() => {
    try {
      return JSON.parse(localStorage.getItem(CHECKOUT_KEY)) || null;
    } catch {
      return null;
    }
  })();

  const branch =
    (cart?.branch ? branches.find((b) => b.id === cart.branch) : null) ||
    storeBranches[0] ||
    branches[0];

  if (!cart) {
    return (
      <div className="route-success">
        <h1>Checkout expired</h1>
        <Link className="route-primary" to="/customer/cart">
          Return to Cart
        </Link>
      </div>
    );
  }

  const customerUser = authStorage.getCustomerUser() || {};
  const customerName = sessionStorage.getItem('bowlCustomerName') || customerUser.name || 'Valued Customer';
  const customerEmail = sessionStorage.getItem('bowlCustomerEmail') || customerUser.email || '';
  const customerMobile = sessionStorage.getItem('bowlCustomerMobile') || customerUser.mobile || '';

  const finalizeOrder = async (paymentData = {}) => {
    try {
      const orderRes = await orderApi.createOrder({
        items: cart.items.map(i => ({ productId: i.productId, quantity: i.quantity })),
        totalAmount: cart.total,
        orderType: cart.type || 'Delivery',
        branchId: branch?.id || 1,
        customerName: customerName,
        deliveryAddress: cart.address,
        addressType: cart.addressType || 'Home'
      });
      const order = orderRes.data || orderRes;
      localStorage.removeItem(CART_KEY);
      localStorage.removeItem(CHECKOUT_KEY);
      navigate(`/customer/order-success?order=${order.id}`);
    } catch (err) {
      alert("Failed to create order");
      setIsProcessing(false);
    }
  };

  const handlePay = () => {
    if (method === 'COD') {
      finalizeOrder({ paymentId: `COD_${Date.now()}` });
      return;
    }

    setIsProcessing(true);
    setPaymentNotice(null);

    openRazorpayCheckout({
      amount: cart.total,
      orderId: `BWL_${Date.now()}`,
      customerName,
      customerEmail,
      customerPhone: customerMobile,
      description: `Payment for Golden Food Bowl (${cart.type || 'Delivery'})`,
      notes: {
        branch: branch?.name || 'Golden Food Bowl',
        orderType: cart.type || 'Delivery',
        itemsCount: cart.items?.length || 1,
      },
      onSuccess: (response) => {
        setIsProcessing(false);
        setPaymentNotice({ type: 'success', message: 'Payment Successful via Razorpay! Confirming your order…' });
        setTimeout(() => {
          finalizeOrder(response);
        }, 600);
      },
      onFailure: (err) => {
        setIsProcessing(false);
        setPaymentNotice({
          type: 'error',
          message: `Payment cancelled or failed. ${err?.description || 'You can try again.'}`,
        });
      },
      onDismiss: () => {
        setIsProcessing(false);
      },
    });
  };

  const paymentOptions = [
    { id: 'Razorpay', label: 'Razorpay Secure Checkout', sub: 'UPI, All Cards, Net Banking, Wallets', icon: '⚡', badge: 'Fastest' },
    { id: 'UPI', label: 'UPI / Google Pay / PhonePe', sub: 'Instant payment via Razorpay UPI', icon: '📱' },
    { id: 'Card', label: 'Credit / Debit Card', sub: 'Visa, Mastercard, RuPay, Maestro', icon: '💳' },
    { id: 'NetBanking', label: 'Net Banking', sub: 'All major Indian banks supported', icon: '🏦' },
    { id: 'COD', label: 'Cash on Delivery', sub: 'Pay with cash upon delivery', icon: '💵' },
  ];

  return (
    <>
      {/* ── Razorpay Gateway Test Mode Banner ── */}
      <div style={{
        background: '#fffdf5',
        border: '1.5px dashed #dfa500',
        borderRadius: 14,
        padding: '12px 14px',
        marginBottom: 14,
        display: 'flex',
        flexDirection: 'column',
        gap: 6
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 16 }}>🛡️</span>
            <strong style={{ fontSize: 12, color: '#92400e', letterSpacing: 0.3 }}>RAZORPAY TEST GATEWAY</strong>
          </div>
          <span style={{
            fontSize: 9.5,
            fontWeight: 800,
            background: '#fef3c7',
            color: '#b45309',
            padding: '2px 8px',
            borderRadius: 999,
            border: '1px solid #fde68a'
          }}>
            TEST MODE ACTIVE
          </span>
        </div>
        <p style={{ fontSize: 11, color: '#78350f', margin: 0, lineHeight: 1.4 }}>
          Key ID: <code style={{ background: '#fef3c7', padding: '1px 4px', borderRadius: 4, fontFamily: 'monospace' }}>{RAZORPAY_KEY_ID}</code>
          <br/>
          Test Cards &amp; UPI simulator enabled for instant testing.
        </p>
      </div>

      {paymentNotice && (
        <div style={{
          padding: '10px 14px',
          borderRadius: 12,
          marginBottom: 12,
          fontSize: 12,
          fontWeight: 600,
          background: paymentNotice.type === 'success' ? '#f0fdf4' : '#fef2f2',
          border: `1px solid ${paymentNotice.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
          color: paymentNotice.type === 'success' ? '#166534' : '#991b1b',
        }}>
          {paymentNotice.type === 'success' ? '✓ ' : '⚠️ '}
          {paymentNotice.message}
        </div>
      )}

      <h2 style={{ fontSize: 14, fontWeight: 800, margin: '8px 0 10px', color: '#1c1917' }}>
        Select Payment Method
      </h2>

      <div className="route-payment-options" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {paymentOptions.map((opt) => (
          <button
            type="button"
            key={opt.id}
            onClick={() => setMethod(opt.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 14px',
              borderRadius: 14,
              border: `1.5px solid ${method === opt.id ? '#dfa500' : '#eedec5'}`,
              background: method === opt.id ? '#fffdf7' : '#fff',
              cursor: 'pointer',
              transition: 'all .2s ease',
              boxShadow: method === opt.id ? '0 2px 8px rgba(223,165,0,0.15)' : 'none',
              textAlign: 'left'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 18 }}>{opt.icon}</span>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <strong style={{ fontSize: 13, color: '#1c1917' }}>{opt.label}</strong>
                  {opt.badge && (
                    <span style={{
                      fontSize: 9,
                      fontWeight: 800,
                      background: '#dfa500',
                      color: '#fff',
                      padding: '1px 6px',
                      borderRadius: 6
                    }}>
                      {opt.badge}
                    </span>
                  )}
                </div>
                <small style={{ fontSize: 11, color: '#78716c', display: 'block', marginTop: 1 }}>
                  {opt.sub}
                </small>
              </div>
            </div>
            <div style={{
              width: 18,
              height: 18,
              borderRadius: '50%',
              border: `2px solid ${method === opt.id ? '#dfa500' : '#d6d3d1'}`,
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0
            }}>
              {method === opt.id && (
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#dfa500' }} />
              )}
            </div>
          </button>
        ))}
      </div>

      <div className="route-summary" style={{ marginTop: 16 }}>
        <span>Subtotal <b>{money(cart.subtotal || cart.total)}</b></span>
        <span>Delivery <b style={{ color: (cart.delivery === 0 || cart.type === 'Pickup') ? '#16a34a' : 'inherit' }}>{(cart.delivery === 0 || cart.type === 'Pickup') ? 'FREE (₹0)' : money(cart.delivery || 40)}</b></span>
        <span>Taxes <b>{money(cart.taxes || Math.round(cart.total * 0.05))}</b></span>
        <hr style={{ margin: '8px 0', borderColor: '#f0e8dc' }} />
        <span>Grand Total <b>{money(cart.total)}</b></span>
      </div>

      <button
        type="button"
        className="route-primary"
        onClick={handlePay}
        disabled={isProcessing}
        style={{
          marginTop: 14,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          background: '#1c1917',
          color: '#f5c518',
          fontSize: 14,
          fontWeight: 800,
          padding: '14px 20px',
          borderRadius: 14,
          border: 0,
          cursor: isProcessing ? 'not-allowed' : 'pointer',
          width: '100%'
        }}
      >
        {isProcessing ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            <span>Connecting to Razorpay...</span>
          </>
        ) : (
          <>
            <CreditCard size={18} />
            <span>
              {method === 'COD' ? `Confirm Order • ${money(cart.total)}` : `Pay ${money(cart.total)} with Razorpay`}
            </span>
          </>
        )}
      </button>

      <div style={{
        marginTop: 10,
        textAlign: 'center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        fontSize: 11,
        color: '#78716c'
      }}>
        <ShieldCheck size={14} color="#16a34a" />
        <span>100% Secure 256-bit Encrypted Checkout</span>
      </div>
    </>
  );
}

function Success(){const {orders}=usePrototypeContext();const navigate=useNavigate();const id=new URLSearchParams(window.location.search).get('order');const order=orders.find(o=>o.id===id)||orders[0];return <div className="route-success"><CheckCircle2/><h1>Order Confirmed!</h1><p>Your order is now visible to Admin, Support and Delivery.</p><b>#{order?.id||id||'BWL10301'}</b><button type="button" className="route-primary" onClick={()=>navigate(`/customer/track/${order?.id||id||'BWL10301'}`)}>Track Order</button><Link className="route-secondary" to="/customer/orders">View Orders</Link></div>}
function formatOrderDateTime(dateStr) {
  if (!dateStr) return { date: '30 Aug 2026', time: '07:30 PM', full: '30 Aug 2026, 07:30 PM' }
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return { date: '30 Aug 2026', time: '07:30 PM', full: '30 Aug 2026, 07:30 PM' }
  const date = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  const time = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
  return { date, time, full: `${date}, ${time}` }
}

function Orders() {
  const { orders } = usePrototypeContext()
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {orders.map(o => {
        const dt = formatOrderDateTime(o.createdAt)
        return (
          <Link
            className="route-order"
            to={`/customer/orders/${o.id}`}
            key={o.id}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              padding: '16px',
              borderRadius: 16,
              border: '1px solid #eee4d2',
              background: '#fff',
              textDecoration: 'none',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 16, fontWeight: 900, color: '#1c1917' }}>#{o.id}</span>
              <strong style={{
                fontSize: 10,
                fontWeight: 800,
                padding: '4px 10px',
                borderRadius: 999,
                background: o.status === 'CANCELLED' ? '#fee2e2' : '#fff8e7',
                color: o.status === 'CANCELLED' ? '#b91c1c' : '#8a6312',
                letterSpacing: 0.5
              }}>
                {o.status === 'CANCELLED' ? '❌ CANCELLED' : o.status.replaceAll('_', ' ')}
              </strong>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 11, color: '#78716c', flexWrap: 'wrap' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 700, color: '#b4811d' }}>
                <Calendar size={12} /> {dt.date}
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 600, color: '#57534e' }}>
                <Clock size={12} /> {dt.time}
              </span>
            </div>

            <div style={{ fontSize: 12, color: '#44403c', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, paddingTop: 4, borderTop: '1px dashed #f5efe6' }}>
              <strong style={{ color: '#1c1917', fontSize: 13 }}>₹{o.total}</strong>
              <span>•</span>
              <span>{o.type}</span>
              <span>•</span>
              <span>{o.branch}</span>
            </div>
          </Link>
        )
      })}
      {orders.length === 0 && (
        <div style={{ textAlign: 'center', padding: 40, color: '#78716c', fontSize: 13 }}>
          No orders placed yet.
        </div>
      )}
    </div>
  )
}

function OrderDetail({id}) {
  const {orders} = usePrototypeContext();
  const o = orders.find(x => x.id === id) || orders[0];
  const dt = formatOrderDateTime(o?.createdAt);
  return (
    <>
      <div style={{ marginBottom: 14 }}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 900 }}>Order #{o?.id}</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6, fontSize: 12, color: '#78716c' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 700, color: '#b4811d' }}>
            <Calendar size={13} /> {dt.date}
          </span>
          <span>•</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 600, color: '#57534e' }}>
            <Clock size={13} /> {dt.time}
          </span>
        </div>
      </div>
      <div className="route-status-list">
        {['CONFIRMED','PREPARING','READY_FOR_PICKUP','ASSIGNED','PICKED_UP','OUT_FOR_DELIVERY','DELIVERED'].map(s => (
          <span key={s}>{s === o?.status || ['CONFIRMED','PREPARING'].includes(s) ? '✓' : '○'} {s.replaceAll('_', ' ')}</span>
        ))}
      </div>
      <Link className="route-primary" to={`/customer/track/${o?.id}`}>Live Track Order</Link>
    </>
  )
}
function Tracking({id}){const {orders}=usePrototypeContext();const o=orders.find(x=>x.id===id)||orders[0];const driverName=o?.driver||'Assigned Partner';const initials=driverName.split(' ').map(x=>x[0]).join('').slice(0,2);return <><div className="route-map">🛵<span>• • • • •</span>🏠</div><h1>Arriving in {o?.eta||25} min</h1><p>Order #{o?.id} • {o?.status?.replaceAll('_',' ')}</p><div className="route-driver"><span>{initials}</span><div><strong>{driverName}</strong><small>Delivery partner</small></div><button type="button">Call</button></div></>}
function Profile() {
  const navigate = useNavigate()
  const [activeModal, setActiveModal] = React.useState(null)
  const customerUser = authStorage.getCustomerUser() || {}
  const [user, setUser] = React.useState(() => {
    return {
      id: customerUser.id,
      name: sessionStorage.getItem('bowlCustomerName') || customerUser.name || 'Customer Account',
      email: sessionStorage.getItem('bowlCustomerEmail') || customerUser.email || 'customer@goldenbowl.com',
      phone: sessionStorage.getItem('bowlCustomerMobile') || customerUser.mobile || '+91 98765 00000',
    }
  })
  const [addresses, setAddresses] = React.useState([])

  React.useEffect(() => {
    if (user.id) {
      addressApi.getAddresses(user.id).then(res => {
        if (res?.data) setAddresses(res.data)
      }).catch(err => console.error(err));
    }
  }, [user.id])

  const handleAddAddress = async () => {
    const newAddrText = window.prompt("Enter new address:")
    if (!newAddrText) return;
    const type = window.prompt("Address type (Home, Work, Other):", "Other") || "Other"
    
    if (user.id) {
      try {
        const res = await addressApi.createAddress(user.id, { type, address: newAddrText, isDefault: addresses.length === 0 });
        if (res?.data) {
          setAddresses(prev => [res.data, ...prev])
        }
      } catch (err) {
        alert("Failed to save address");
      }
    }
  }
  const [paymentMethods] = React.useState([
    { id: 1, type: 'UPI', name: 'Google Pay', detail: 'priya@okicici', isDefault: true },
    { id: 2, type: 'Card', name: 'HDFC Credit Card', detail: '•••• 4092', isDefault: false },
    { id: 3, type: 'Wallet', name: 'Paytm Wallet', detail: '₹450 Balance', isDefault: false },
  ])

  const handleSaveProfile = (e) => {
    e.preventDefault()
    sessionStorage.setItem('bowlCustomerName', user.name)
    sessionStorage.setItem('bowlCustomerEmail', user.email)
    sessionStorage.setItem('bowlCustomerMobile', user.phone)
    setActiveModal(null)
  }

  const signOut = () => {
    sessionStorage.clear()
    navigate('/customer/signin', { replace: true })
  }

  return (
    <div className="profile-page-container">
      <div className="profile-header-card">
        <div className="profile-avatar">
          {user.name.split(' ').map(n => n[0]).join('').slice(0, 2) || 'PS'}
        </div>
        <div className="profile-info">
          <h2>{user.name}</h2>
          <span>{user.email}</span>
          <small>{user.phone}</small>
        </div>
        <button type="button" className="edit-profile-btn" onClick={() => setActiveModal('editProfile')}>
          Edit
        </button>
      </div>

      <div className="profile-menu-group">
        <button type="button" className="route-list-row profile-menu-item" onClick={() => setActiveModal('addresses')}>
          <span>📍 My Addresses</span>
          <b>{addresses.length} Saved ›</b>
        </button>

        <button type="button" className="route-list-row profile-menu-item" onClick={() => setActiveModal('payments')}>
          <span>💳 Saved Payments</span>
          <b>{paymentMethods.length} Methods ›</b>
        </button>

        <Link className="route-list-row profile-menu-item" to="/customer/notifications">
          <span>🔔 Notifications</span>
          <b>View ›</b>
        </Link>

        <button type="button" className="route-list-row profile-menu-item" onClick={() => setActiveModal('support')}>
          <span>🎧 Help & Support</span>
          <b>24x7 ›</b>
        </button>

        <Link className="route-list-row profile-menu-item" to="/admin/dashboard" style={{ background: '#fffdf5', borderColor: '#fde68a' }}>
          <span>🛡️ Admin Operations Portal</span>
          <b style={{ color: '#b4811d' }}>Open ›</b>
        </Link>

        <Link className="route-list-row profile-menu-item" to="/delivery/dashboard" style={{ background: '#f0fdf4', borderColor: '#bbf7d0' }}>
          <span>🛵 Delivery Partner Portal</span>
          <b style={{ color: '#16a34a' }}>Open ›</b>
        </Link>

        <button type="button" className="route-list-row profile-menu-item danger" onClick={() => setActiveModal('logout')}>
          <span><LogOut size={17}/> Sign Out</span>
          <b>›</b>
        </button>
      </div>

      {/* Edit Profile Modal */}
      {activeModal === 'editProfile' && (
        <div className="branch-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="branch-modal" onClick={e => e.stopPropagation()}>
            <div className="branch-modal-head">
              <h3>Edit Profile</h3>
              <button type="button" className="close-btn" onClick={() => setActiveModal(null)}>✕</button>
            </div>
            <form onSubmit={handleSaveProfile} className="profile-form">
              <label>
                <span>Full Name</span>
                <input 
                  type="text" 
                  value={user.name} 
                  onChange={e => setUser({ ...user, name: e.target.value })}
                  required 
                />
              </label>
              <label>
                <span>Email Address</span>
                <input 
                  type="email" 
                  value={user.email} 
                  onChange={e => setUser({ ...user, email: e.target.value })}
                  required 
                />
              </label>
              <label>
                <span>Phone Number</span>
                <input 
                  type="tel" 
                  value={user.phone} 
                  onChange={e => setUser({ ...user, phone: e.target.value })}
                  required 
                />
              </label>
              <button type="submit" className="route-primary">Save Changes</button>
            </form>
          </div>
        </div>
      )}

      {/* Addresses Modal */}
      {activeModal === 'addresses' && (
        <div className="branch-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="branch-modal" onClick={e => e.stopPropagation()}>
            <div className="branch-modal-head">
              <h3>Saved Addresses</h3>
              <button type="button" className="close-btn" onClick={() => setActiveModal(null)}>✕</button>
            </div>
            <div className="branch-modal-list">
              {addresses.map(a => (
                <div key={a.id} className="branch-option selected" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                    <strong>📍 {a.type}</strong>
                    {a.isDefault && <span className="offer-badge" style={{ fontSize: 8 }}>DEFAULT</span>}
                  </div>
                  <span style={{ fontSize: 10, color: '#666' }}>{a.address}</span>
                </div>
              ))}
            </div>
            <button 
              type="button" 
              className="route-secondary" 
              style={{ marginTop: 10, width: '100%' }}
              onClick={handleAddAddress}
            >
              + Add New Address
            </button>
          </div>
        </div>
      )}

      {/* Payments Modal */}
      {activeModal === 'payments' && (
        <div className="branch-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="branch-modal" onClick={e => e.stopPropagation()}>
            <div className="branch-modal-head">
              <h3>Saved Payments</h3>
              <button type="button" className="close-btn" onClick={() => setActiveModal(null)}>✕</button>
            </div>
            <div className="branch-modal-list">
              {paymentMethods.map(p => (
                <div key={p.id} className="branch-option selected">
                  <div className="branch-meta">
                    <strong>💳 {p.name}</strong>
                    <span>{p.detail}</span>
                  </div>
                  {p.isDefault && <span className="offer-badge" style={{ fontSize: 8 }}>DEFAULT</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Support Modal */}
      {activeModal === 'support' && (
        <div className="branch-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="branch-modal" onClick={e => e.stopPropagation()}>
            <div className="branch-modal-head">
              <h3>24x7 Help & Support</h3>
              <button type="button" className="close-btn" onClick={() => setActiveModal(null)}>✕</button>
            </div>
            <div className="branch-modal-list">
              <button type="button" className="branch-option" onClick={() => navigate('/support')}>
                <strong>💬 Live Support Chat</strong>
              </button>
              <button type="button" className="branch-option" onClick={() => alert('Calling Golden Food Bowl Helpline: 1800-500-BOWL')}>
                <strong>📞 Call Support (1800-500-BOWL)</strong>
              </button>
              <button type="button" className="branch-option" onClick={() => alert('Refund policy: 100% refund for cancelled or delayed orders.')}>
                <strong>📜 Refund & Cancellation Policy</strong>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logout Modal */}
      {activeModal === 'logout' && (
        <div className="branch-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="branch-modal" onClick={e => e.stopPropagation()}>
            <div className="branch-modal-head">
              <h3>Confirm Sign Out</h3>
              <button type="button" className="close-btn" onClick={() => setActiveModal(null)}>✕</button>
            </div>
            <p style={{ fontSize: 12, color: '#555', margin: '8px 0 16px' }}>Are you sure you want to sign out from Golden Food Bowl?</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" className="route-secondary" style={{ flex: 1 }} onClick={() => setActiveModal(null)}>Cancel</button>
              <button type="button" className="route-primary" style={{ flex: 1, background: '#dc2626' }} onClick={signOut}>Sign Out</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
function CustomerNotifications(){const {notifications}=usePrototypeContext();return <NotificationPanel notifications={notifications} role="customer"/>}
