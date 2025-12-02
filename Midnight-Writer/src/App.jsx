import React, { useState, useEffect, useRef } from 'react';

/* --- ASSETS & STYLES --- */
const FONTS = `
  @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@400;700&family=Crimson+Text:ital,wght@0,400;0,600;1,400&family=Playfair+Display:ital,wght@0,400;0,700;1,400&display=swap');
`;

const TEXTURES = {
  wood: "radial-gradient(circle at 50% 0%, #1a0f05 10%, #0d0603 60%, #000000 90%)",
  paper: `
    linear-gradient(to right, rgba(0,0,0,0.06) 0%, rgba(0,0,0,0) 5%, rgba(0,0,0,0) 95%, rgba(0,0,0,0.06) 100%),
    repeating-linear-gradient(transparent, transparent 27px, rgba(40, 30, 20, 0.08) 28px),
    url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.08'/%3E%3C/svg%3E")
  `,
  leather: `
    radial-gradient(circle at 30% 30%, rgba(255,255,255,0.05), transparent 40%),
    linear-gradient(135deg, #2a1a10 0%, #1a0f08 100%),
    url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.5' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.15'/%3E%3C/svg%3E")
  `
};

/* --- INLINE ICONS --- */
const TrashIcon = ({ size = 24, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M3 6h18"></path>
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
    <line x1="10" y1="11" x2="10" y2="17"></line>
    <line x1="14" y1="11" x2="14" y2="17"></line>
  </svg>
);

const EditIcon = ({ size = 24, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
  </svg>
);

const SaveIcon = ({ size = 24, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v13a2 2 0 0 1-2 2z"></path>
    <polyline points="17 21 17 13 7 13 7 21"></polyline>
    <polyline points="7 3 7 8 15 8"></polyline>
  </svg>
);

const PlusIcon = ({ size = 24, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

const ArrowLeftIcon = ({ size = 24, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="19" y1="12" x2="5" y2="12"></line>
    <polyline points="12 19 5 12 12 5"></polyline>
  </svg>
);

const MoreIcon = ({ size = 24, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="1"></circle>
    <circle cx="19" cy="12" r="1"></circle>
    <circle cx="5" cy="12" r="1"></circle>
  </svg>
);

const CloseIcon = ({ size = 24, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

/* --- COMPONENTS --- */

// 1. LIBRARY VIEW
const Library = ({ books, onOpenBook, onCreateBook, onDeleteBook }) => {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-start pt-24 relative overflow-hidden text-amber-50">
      <div className="absolute inset-0 z-0 pointer-events-none" style={{ background: TEXTURES.wood }}></div>
      <div className="absolute inset-0 bg-black/40 z-0 pointer-events-none backdrop-blur-[2px]"></div>
      
      <div className="relative z-10 w-full max-w-6xl px-12">
        <h1 className="text-5xl font-serif mb-4 text-amber-100/90 tracking-widest text-center pb-8 border-b border-white/5 font-bold">
          The Midnight Library
        </h1>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-16 mt-16 perspective-1000">
          {books.map((book) => (
            <div 
              key={book.id}
              className="group relative cursor-pointer transform transition-all duration-500 hover:-translate-y-4 hover:rotate-y-6"
              onClick={() => onOpenBook(book.id)}
            >
              <div className="w-full aspect-[2/3] rounded-r-lg rounded-l-sm shadow-2xl relative overflow-hidden transition-all duration-300 group-hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.7)]"
                   style={{ background: TEXTURES.leather, boxShadow: 'inset 4px 0 10px rgba(0,0,0,0.5), 5px 5px 15px rgba(0,0,0,0.5)' }}>
                <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-white/10 to-transparent border-r border-black/20"></div>
                <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center ml-4">
                  <div className="w-full border-t border-b border-amber-500/30 py-6 mb-4">
                    <h3 className="font-display text-2xl text-transparent bg-clip-text bg-gradient-to-br from-amber-200 to-amber-500 leading-tight drop-shadow-sm">
                      {book.title}
                    </h3>
                  </div>
                  <span className="text-[10px] text-amber-500/60 font-serif tracking-[0.2em] uppercase mt-auto">
                    {new Date(book.lastModified).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); onDeleteBook(book.id); }}
                className="absolute -top-3 -right-3 bg-red-900/80 p-2.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700 text-white shadow-lg border border-red-500/20"
              >
                <TrashIcon size={14} />
              </button>
            </div>
          ))}

          <div 
            onClick={onCreateBook}
            className="w-full aspect-[2/3] border border-dashed border-white/10 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 transition-all group hover:border-amber-500/30"
          >
            <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center mb-6 group-hover:bg-amber-500/10 group-hover:text-amber-400 transition-colors text-white/30 border border-white/5 group-hover:border-amber-500/20">
              <PlusIcon size={28} />
            </div>
            <span className="font-serif text-lg text-white/30 group-hover:text-amber-200/80 transition-colors">New Journal</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// 2. CLOSED BOOK COVER
const ClosedBookCover = ({ title, date, onClick }) => {
  return (
    <div 
      onClick={onClick}
      className="w-full h-full rounded-r-lg rounded-l-sm shadow-2xl relative overflow-hidden cursor-pointer"
      style={{ background: TEXTURES.leather, boxShadow: 'inset 10px 0 20px rgba(0,0,0,0.6)' }}
    >
      <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-white/10 via-transparent to-black/20"></div>
      <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center ml-8">
        <div className="border-2 border-amber-600/30 p-8 w-full h-full flex flex-col items-center justify-center rounded-sm">
          <div className="mb-12 opacity-80">
            <span className="block w-8 h-8 mx-auto border-t-2 border-l-2 border-amber-500/40 transform rotate-45 mb-2"></span>
          </div>
          <h1 className="font-display text-5xl text-transparent bg-clip-text bg-gradient-to-b from-amber-100 via-amber-300 to-amber-600 mb-6 drop-shadow-md tracking-wide">
            {title}
          </h1>
          <div className="w-16 h-1 bg-amber-700/40 mb-6"></div>
          <p className="font-serif text-amber-500/70 text-sm tracking-[0.3em] uppercase">
            {new Date(date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>
    </div>
  );
};

// 3. PAGE COMPONENT
const PageContent = ({ 
  content, 
  pageNumber, 
  isActive, 
  onContentChange, 
  onNextPage, 
  tabs = [],
  onTabClick, 
  isLeftPage
}) => {
  const textAreaRef = useRef(null);

  const handleInput = (e) => {
    const target = e.target;
    const val = target.value;
    
    if (target.scrollHeight > target.clientHeight) {
      const words = val.split(' ');
      const lastWord = words.pop();
      const currentContent = words.join(' ');
      onContentChange(currentContent);
      onNextPage(lastWord);
    } else {
      onContentChange(val);
    }
  };

  useEffect(() => {
    if (isActive && textAreaRef.current) {
      textAreaRef.current.focus();
      textAreaRef.current.setSelectionRange(textAreaRef.current.value.length, textAreaRef.current.value.length);
    }
  }, [isActive]);

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden bg-[#f4e4bc]"
         style={{ 
           backgroundImage: TEXTURES.paper,
           boxShadow: isLeftPage 
             ? 'inset -15px 0 40px rgba(60, 40, 20, 0.15)' 
             : 'inset 15px 0 40px rgba(60, 40, 20, 0.15)'   
         }}>
      <div className="h-12 w-full"></div>
      <div className="flex-1 relative px-10 z-10">
        <textarea
          ref={textAreaRef}
          value={content}
          onChange={handleInput}
          className="w-full h-full bg-transparent border-none resize-none outline-none font-handwriting text-2xl leading-[28px] text-[#2a1a10]/90 overflow-hidden selection:bg-amber-900/20"
          spellCheck={false}
          placeholder={isActive ? "" : ""}
        />
      </div>
      <div className="h-12 w-full flex items-center justify-between px-8 pb-4 text-[#5c4a3d]/50 font-serif text-sm">
        <span>{isLeftPage && pageNumber ? pageNumber : ''}</span>
        <span>{!isLeftPage && pageNumber ? pageNumber : ''}</span>
      </div>
      <div className={`absolute top-0 bottom-0 w-16 pointer-events-none z-20 mix-blend-multiply opacity-40
        ${isLeftPage 
          ? 'right-0 bg-gradient-to-l from-black/80 via-black/10 to-transparent' 
          : 'left-0 bg-gradient-to-r from-black/80 via-black/10 to-transparent'}`}
      ></div>
      {!isLeftPage && (
        <div className="absolute top-16 -right-[24px] flex flex-col gap-3 z-50 perspective-500">
          {tabs.map((tab) => (
            <div 
              key={tab.id}
              onClick={(e) => { e.stopPropagation(); onTabClick(tab.pageIndex); }}
              className="group cursor-pointer relative transform transition-transform hover:translate-x-1"
              title={tab.label}
            >
              <div 
                className="w-8 h-10 rounded-r-md shadow-[2px_2px_5px_rgba(0,0,0,0.3)] flex items-center justify-center border-l border-black/10 text-shadow-sm"
                style={{ 
                  backgroundColor: tab.color,
                  boxShadow: 'inset 2px 0 5px rgba(255,255,255,0.2), 2px 2px 5px rgba(0,0,0,0.3)'
                }}
              >
                <span className="text-[9px] font-serif font-bold text-black/70 -rotate-90 whitespace-nowrap tracking-wider uppercase">
                  {tab.label.substring(0, 8)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// 4. BOOK ENGINE
const BookEngine = ({ book, updateBook, onClose, onExport }) => {
  const [currentSpreadIndex, setCurrentSpreadIndex] = useState(0); 
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipDirection, setFlipDirection] = useState('next'); 
  const [showTabModal, setShowTabModal] = useState(false);
  const [overflowBuffer, setOverflowBuffer] = useState(''); 

  const totalSpreads = Math.ceil(book.pages.length / 2) + 1;

  const getLeftPageContent = (spreadIndex) => {
    if (spreadIndex <= 0) return null;
    if (spreadIndex === 1) return null; 
    const pageIndex = (spreadIndex - 1) * 2 - 1; 
    return { text: book.pages[pageIndex] || '', index: pageIndex };
  };

  const getRightPageContent = (spreadIndex) => {
    if (spreadIndex === 0) return null; 
    const pageIndex = (spreadIndex - 1) * 2; 
    return { text: book.pages[pageIndex] || '', index: pageIndex };
  };

  /* --- FLIP LOGIC WITH "LOOK AHEAD" --- */
  let staticLeftIndex = currentSpreadIndex;
  let staticRightIndex = currentSpreadIndex;

  if (isFlipping) {
    if (flipDirection === 'next') {
        staticRightIndex = currentSpreadIndex + 1;
    } else {
        staticLeftIndex = currentSpreadIndex - 1;
    }
  }

  const staticLeftPage = getLeftPageContent(staticLeftIndex);
  const staticRightPage = getRightPageContent(staticRightIndex);

  const isOpening = flipDirection === 'next' && currentSpreadIndex === 0;
  const isClosing = flipDirection === 'prev' && currentSpreadIndex === 1;

  const leatherStyle = { backgroundImage: TEXTURES.leather, backgroundColor: '#2a1a10' };
  const paperStyle = { backgroundImage: TEXTURES.paper, backgroundColor: '#e3d0a8' };

  let flipperFrontStyle = paperStyle;
  let flipperBackStyle = paperStyle;

  if (isOpening) {
    flipperFrontStyle = leatherStyle; 
    flipperBackStyle = leatherStyle;  
  } else if (isClosing) {
    flipperFrontStyle = leatherStyle; 
    flipperBackStyle = leatherStyle;  
  }

  const handleNext = (overflowText = null) => {
    if (isFlipping) return;

    if (currentSpreadIndex < totalSpreads - 1) {
      setFlipDirection('next');
      setIsFlipping(true);
      if (overflowText) setOverflowBuffer(overflowText);

      setTimeout(() => {
        if (overflowText) {
             const targetIdx = (currentSpreadIndex * 2); 
             if (targetIdx < book.pages.length) {
               const newPages = [...book.pages];
               newPages[targetIdx] = overflowText + (newPages[targetIdx] || '');
               updateBook({ ...book, pages: newPages });
             }
        }
        setCurrentSpreadIndex(prev => prev + 1);
        setIsFlipping(false);
        setOverflowBuffer('');
      }, 900);
    } else {
        let newPages = [...book.pages];
        if (overflowText) {
            newPages.push(overflowText, ''); 
        } else {
            newPages.push('', ''); 
        }
        updateBook({ ...book, pages: newPages });
        setFlipDirection('next');
        setIsFlipping(true);
        if (overflowText) setOverflowBuffer(overflowText);

        setTimeout(() => {
            setCurrentSpreadIndex(prev => prev + 1);
            setIsFlipping(false);
            setOverflowBuffer('');
        }, 900);
    }
  };

  const handlePrev = () => {
    if (currentSpreadIndex > 0 && !isFlipping) {
      setFlipDirection('prev');
      setIsFlipping(true);
      setTimeout(() => {
        setCurrentSpreadIndex(prev => prev - 1);
        setIsFlipping(false);
      }, 900);
    }
  };

  const jumpToPage = (pageIndex) => {
    const spread = Math.floor(pageIndex / 2) + 1;
    setCurrentSpreadIndex(spread);
  };

  const updatePage = (index, text) => {
    const newPages = [...book.pages];
    newPages[index] = text;
    updateBook({ ...book, pages: newPages, lastModified: Date.now() });
  };

  const addTab = (label, color) => {
    const rightPage = getRightPageContent(currentSpreadIndex);
    if (!rightPage) return;
    const newTab = { id: Date.now(), label, color, pageIndex: rightPage.index };
    updateBook({ ...book, tabs: [...(book.tabs || []), newTab] });
    setShowTabModal(false);
  };

  const wordCount = book.pages.reduce((acc, page) => acc + page.trim().split(/\s+/).filter(w => w.length > 0).length, 0);

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden">
      <style>{FONTS}</style>
      
      <div className="absolute inset-0 z-0 bg-[#1a1008]" style={{ background: TEXTURES.wood }}></div>
      <div className="absolute inset-0 z-0 opacity-30 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')]"></div>
      
      <div className="absolute top-[-20%] left-[10%] w-[90vw] h-[90vw] bg-[radial-gradient(circle,rgba(255,200,120,0.12)_0%,rgba(0,0,0,0)_65%)] pointer-events-none blur-3xl z-10"></div>
      <div className="absolute top-[-5%] left-[25%] w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(255,230,180,0.25)_0%,rgba(0,0,0,0)_70%)] pointer-events-none mix-blend-overlay filter blur-[80px] z-10 animate-pulse-slow"></div>
      <div className="absolute inset-0 pointer-events-none z-20 bg-[radial-gradient(circle_at_center,transparent_30%,black_90%)] opacity-90"></div>

      {/* Top Bar with Title Edit */}
      <div className="absolute top-0 left-0 w-full h-20 z-50 flex items-center justify-between px-8 bg-gradient-to-b from-black/90 via-black/40 to-transparent">
        <div className="flex items-center gap-6 pointer-events-auto">
          <button onClick={onClose} className="text-amber-100/60 hover:text-amber-100 transition-colors flex items-center gap-2 group">
            <div className="p-2 rounded-full bg-white/5 group-hover:bg-white/10 transition-colors">
              <ArrowLeftIcon size={16} /> 
            </div>
            <span className="font-serif tracking-widest text-sm uppercase hidden sm:inline">Library</span>
          </button>
          
          <div className="flex items-center gap-2 group">
             <input 
               value={book.title}
               onChange={(e) => updateBook({...book, title: e.target.value})}
               className="bg-transparent border-b border-transparent hover:border-amber-500/30 focus:border-amber-500/50 outline-none font-display text-xl sm:text-2xl text-amber-100/90 placeholder-amber-500/30 w-48 sm:w-96 transition-all text-center sm:text-left"
             />
             <EditIcon size={14} className="text-amber-500/30 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
        
        {currentSpreadIndex > 0 && (
          <div className="pointer-events-auto flex items-center gap-3">
            <button 
              onClick={() => setShowTabModal(true)} 
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#1a0f08]/80 hover:bg-[#2a1a10] text-amber-100/80 transition-colors border border-amber-500/20 backdrop-blur-sm"
            >
              <MoreIcon size={14} /> <span className="text-xs font-serif uppercase tracking-widest hidden sm:inline">Tab</span>
            </button>
            <button 
              onClick={onExport}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-amber-900/40 hover:bg-amber-800/60 text-amber-100 transition-colors border border-amber-500/30 backdrop-blur-sm"
            >
              <SaveIcon size={14} /> <span className="text-xs font-serif uppercase tracking-widest hidden sm:inline">Export</span>
            </button>
          </div>
        )}
      </div>

      {/* --- 3D BOOK STAGE --- */}
      <div className="relative z-30 perspective-2000 mt-4 group">
        <div 
           className={`relative w-[85vw] max-w-[1100px] aspect-[3/2] transform-style-3d transition-transform duration-700 ease-in-out
           ${currentSpreadIndex === 0 ? '-translate-x-[25%]' : 'translate-x-0'}`}
        >
          
          <div className="absolute inset-x-8 top-8 bottom-[-20px] bg-black/60 blur-2xl rounded-[50%] translate-z-[-50px]"></div>

          {/* LEFT STACK (Static) */}
          <div className={`absolute top-0 bottom-0 left-0 w-1/2 rounded-l-lg origin-right transition-opacity duration-300
             ${staticLeftIndex === 0 ? 'opacity-0' : 'opacity-100'}`}
             style={{ 
               background: staticLeftIndex === 1 ? '#2a1a10' : '#e3d0a8', 
               backgroundImage: staticLeftIndex === 1 ? TEXTURES.leather : TEXTURES.paper,
               boxShadow: 'inset -5px 0 20px rgba(0,0,0,0.4)'
             }}>
             {staticLeftIndex > 1 && staticLeftPage && (
               <PageContent 
                  content={staticLeftPage.text} 
                  pageNumber={staticLeftPage.index + 1}
                  isLeftPage={true}
                  isActive={!isFlipping}
                  onContentChange={(val) => updatePage(staticLeftPage.index, val)}
               />
             )}
          </div>

          {/* RIGHT STACK (Static) */}
          <div className="absolute top-0 bottom-0 right-0 w-1/2 rounded-r-lg origin-left"
             style={{ 
               background: staticRightIndex === 0 ? 'transparent' : '#e3d0a8',
               backgroundImage: staticRightIndex === 0 ? 'none' : TEXTURES.paper,
               boxShadow: staticRightIndex === 0 ? 'none' : 'inset 5px 0 20px rgba(0,0,0,0.2), 5px 5px 15px rgba(0,0,0,0.3)'
             }}>
             {staticRightIndex === 0 && (
               <ClosedBookCover 
                 title={book.title} 
                 date={book.lastModified} 
                 onClick={() => handleNext()} 
               />
             )}
             {staticRightIndex > 0 && staticRightPage && (
               <PageContent 
                  content={staticRightPage.text} 
                  pageNumber={staticRightPage.index + 1}
                  isActive={!isFlipping}
                  onContentChange={(val) => updatePage(staticRightPage.index, val)}
                  onNextPage={handleNext}
                  tabs={book.tabs}
                  onTabClick={jumpToPage}
                  isLeftPage={false}
               />
             )}
          </div>

          {/* SPINE - MOVED INSIDE THE TRANSFORM CONTAINER */}
          <div className={`absolute left-1/2 top-0 bottom-0 w-12 -ml-6 z-40 rounded-sm transition-opacity duration-500
            ${currentSpreadIndex === 0 ? 'opacity-0' : 'opacity-100'}`}
            style={{ 
               background: 'linear-gradient(to right, #1a0f08, #2a1a10 40%, #2a1a10 60%, #1a0f08)',
               boxShadow: 'inset 0 0 10px rgba(0,0,0,0.8), 0 0 5px rgba(0,0,0,0.5)'
            }}>
          </div>

          {/* ANIMATED PAGE FLIPPER */}
          {isFlipping && (
            <div 
              className={`absolute top-0 bottom-0 w-1/2 z-50 transform-style-3d
                ${flipDirection === 'next' 
                  ? 'right-0 origin-left animate-flip-right-to-left'
                  : 'left-0 origin-right animate-flip-left-to-right'
                }`}
            >
              {/* FRONT FACE */}
              <div className="absolute inset-0 backface-hidden overflow-hidden rounded-r-sm"
                   style={flipperFrontStyle}>
                {flipDirection === 'next' ? (
                  currentSpreadIndex === 0 ? (
                    <ClosedBookCover title={book.title} date={book.lastModified} />
                  ) : (
                    (() => {
                      const content = getRightPageContent(currentSpreadIndex);
                      return (
                        <PageContent 
                          content={content?.text || ''}
                          pageNumber={content ? content.index + 1 : null}
                          tabs={book.tabs}
                          isLeftPage={false}
                        />
                      );
                    })()
                  )
                ) : (
                   (() => {
                      const content = getLeftPageContent(currentSpreadIndex);
                      return (
                         <PageContent 
                           content={content?.text || ''}
                           pageNumber={content ? content.index + 1 : null}
                           isLeftPage={true}
                         />
                      );
                   })()
                )}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-black/20 pointer-events-none"></div>
              </div>

              {/* BACK FACE */}
              <div className="absolute inset-0 backface-hidden rotate-y-180 overflow-hidden rounded-l-sm"
                   style={flipperBackStyle}>
                 {flipDirection === 'next' ? (
                    (() => {
                      const content = getLeftPageContent(currentSpreadIndex + 1);
                      return (
                        <PageContent 
                          content={content?.text || ''}
                          pageNumber={content ? content.index + 1 : null}
                          isLeftPage={true}
                        />
                      );
                    })()
                 ) : (
                    currentSpreadIndex === 1 ? (
                      <ClosedBookCover title={book.title} date={book.lastModified} />
                    ) : (
                      (() => {
                        const content = getRightPageContent(currentSpreadIndex - 1);
                        return (
                          <PageContent 
                            content={content?.text || ''}
                            pageNumber={content ? content.index + 1 : null}
                            isLeftPage={false}
                          />
                        );
                      })()
                    )
                 )}
                 <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-black/20 pointer-events-none"></div>
              </div>
            </div>
          )}

          {/* Navigation Click Zones */}
          <div className="absolute inset-y-0 -left-12 w-32 z-40 hover:bg-white/5 transition-colors cursor-w-resize opacity-0 hover:opacity-100 flex items-center justify-start pl-4" onClick={handlePrev}>
             <div className="bg-black/50 p-2 rounded-full text-white/50"><ArrowLeftIcon size={24} /></div>
          </div>
          <div className="absolute inset-y-0 -right-12 w-32 z-40 hover:bg-white/5 transition-colors cursor-e-resize opacity-0 hover:opacity-100 flex items-center justify-end pr-4" onClick={() => handleNext()}>
             <div className="bg-black/50 p-2 rounded-full text-white/50 rotate-180"><ArrowLeftIcon size={24} /></div>
          </div>

        </div>
      </div>

      {currentSpreadIndex > 0 && (
        <div className="absolute bottom-8 z-50 text-amber-100/30 font-serif text-xs tracking-[0.2em] flex items-center gap-8 uppercase">
          <span>{wordCount} Words</span>
          <div className="w-1 h-1 rounded-full bg-amber-500/30"></div>
          <span>
             {currentSpreadIndex === 1 ? 'Title Page' : `Pages ${(currentSpreadIndex - 1) * 2} - ${(currentSpreadIndex - 1) * 2 + 1}`}
          </span>
        </div>
      )}

      {showTabModal && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md animate-fade-in">
          <div className="bg-[#1a1008] p-8 rounded-xl border border-amber-900/40 shadow-2xl w-96 relative">
            <button onClick={() => setShowTabModal(false)} className="absolute top-4 right-4 text-amber-100/30 hover:text-white">
              <CloseIcon size={18} />
            </button>
            <h3 className="text-amber-100 font-display text-2xl mb-2 text-center">New Bookmark</h3>
            <p className="text-amber-500/50 text-center text-xs mb-6 uppercase tracking-widest font-serif">Mark this page for later</p>
            
            <input 
              id="tabLabel"
              placeholder="Chapter Title..." 
              className="w-full bg-black/30 border border-amber-900/30 rounded-lg px-4 py-3 text-amber-50 mb-6 focus:outline-none focus:border-amber-600 font-serif text-lg placeholder-amber-900/50"
              autoFocus
            />
            
            <div className="flex justify-center gap-3 mb-8">
              {['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7', '#ec4899'].map(color => (
                <button 
                  key={color} 
                  onClick={() => addTab(document.getElementById('tabLabel').value || 'Bookmark', color)}
                  className="w-8 h-8 rounded-full cursor-pointer hover:scale-110 transition-transform border-2 border-transparent hover:border-white/50 focus:scale-110"
                  style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}40` }}
                ></button>
              ))}
            </div>
            
            <button 
              onClick={() => addTab(document.getElementById('tabLabel').value || 'Bookmark', '#eab308')}
              className="w-full py-3 bg-amber-900/40 hover:bg-amber-800/60 border border-amber-700/30 rounded-lg text-amber-100 text-sm font-serif tracking-widest uppercase transition-colors"
            >
              Create Tab
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// 5. MAIN APP CONTAINER
const App = () => {
  const [view, setView] = useState('library');
  const [books, setBooks] = useState([
    { 
      id: 1, 
      title: "The Midnight Notes", 
      lastModified: Date.now(), 
      pages: ["The rain tapped against the window pane...", "I couldn't recall when the fire had died down...", "Tomorrow I would leave this place."],
      tabs: [{ id: 1, label: "Intro", color: "#ef4444", pageIndex: 1 }]
    },
    { 
      id: 2, 
      title: "Dreams of Dust", 
      lastModified: Date.now() - 86400000, 
      pages: ["Dust motes floated in the shaft of light...", ""], 
      tabs: [] 
    }
  ]);
  const [activeBookId, setActiveBookId] = useState(null);

  const handleOpenBook = (id) => {
    setActiveBookId(id);
    setView('book');
  };

  const handleCreateBook = () => {
    const newBook = {
      id: Date.now(),
      title: "Untitled Journal",
      lastModified: Date.now(),
      pages: ["", ""],
      tabs: []
    };
    setBooks([...books, newBook]);
    setActiveBookId(newBook.id);
    setView('book');
  };

  const handleExport = () => {
    window.print();
  };

  const activeBook = books.find(b => b.id === activeBookId);

  return (
    <div className="font-sans bg-black min-h-screen text-slate-900 overflow-hidden selection:bg-amber-900/30">
      <style>{`
        .font-handwriting { font-family: 'Caveat', cursive; }
        .font-serif { font-family: 'Crimson Text', serif; }
        .font-display { font-family: 'Playfair Display', serif; }
        
        .perspective-1000 { perspective: 1000px; }
        .perspective-2000 { perspective: 2000px; }
        .perspective-500 { perspective: 500px; }
        .transform-style-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }

        /* Animation Keyframes */
        @keyframes flipRightToLeft {
          0% { transform: rotateY(0deg); }
          100% { transform: rotateY(-180deg); }
        }
        @keyframes flipLeftToRight {
          0% { transform: rotateY(0deg); } 
          100% { transform: rotateY(180deg); }
        }
        
        .animate-flip-right-to-left { animation: flipRightToLeft 0.9s cubic-bezier(0.645, 0.045, 0.355, 1.000) forwards; }
        .animate-flip-left-to-right { animation: flipLeftToRight 0.9s cubic-bezier(0.645, 0.045, 0.355, 1.000) forwards; }
        
        .animate-pulse-slow { animation: pulse 8s ease-in-out infinite; }
        .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

        @media print {
          body * { visibility: hidden; }
          .book-content-print, .book-content-print * { visibility: visible; }
          .book-content-print { 
            position: absolute; left: 0; top: 0; width: 100%; 
            background: white; color: black; padding: 2cm;
          }
          .print-page { page-break-after: always; margin-bottom: 2rem; }
        }
      `}</style>

      {view === 'library' && (
        <Library 
          books={books} 
          onOpenBook={handleOpenBook} 
          onCreateBook={handleCreateBook}
          onDeleteBook={(id) => setBooks(books.filter(b => b.id !== id))}
        />
      )}

      {view === 'book' && activeBook && (
        <BookEngine 
          book={activeBook} 
          updateBook={(b) => setBooks(books.map(x => x.id === b.id ? b : x))} 
          onClose={() => setView('library')}
          onExport={handleExport}
        />
      )}

      {/* --- EXPORT VIEW (Hidden until print) --- */}
      <div className="book-content-print hidden">
        {activeBook && (
          <div className="max-w-[800px] mx-auto p-12">
            <div className="text-center mb-24 mt-12 page-break-after-always">
              <h1 className="text-5xl font-serif font-bold mb-6 text-black">{activeBook.title}</h1>
              <div className="w-16 h-1 bg-black/20 mx-auto mb-6"></div>
              <p className="text-gray-500 italic font-serif">
                Last modified: {new Date(activeBook.lastModified).toLocaleDateString()}
              </p>
            </div>
            
            {activeBook.pages.map((page, i) => (
              <div key={i} className="mb-12 relative page-break-inside-avoid">
                 {/* Print Page Content */}
                 <div className="mb-2 text-right text-xs text-gray-400 font-serif">
                   {i + 1}
                 </div>
                 <div className="font-serif text-lg leading-relaxed text-justify text-gray-900 whitespace-pre-wrap">
                   {page}
                 </div>
                 <div className="mt-8 border-b border-gray-100"></div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default App;