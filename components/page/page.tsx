import Nav from '@root/components/nav';
import { AppContext } from '@root/contexts/appContext';
import { ScreenSize } from '@root/hooks/useDeviceCheck';
import classNames from 'classnames';
import { useRouter } from 'next/router';
import React, { JSX, useContext, useEffect, useState } from 'react';
import Dimensions from '../../constants/dimensions';
import { PageContext } from '../../contexts/pageContext';
import LinkInfo from '../formatted/linkInfo';
import Header from '../header';
import Footer from './footer';

interface PageProps {
  children: React.ReactNode;
  folders?: LinkInfo[];
  hideFooter?: boolean;
  isFullScreen?: boolean;
  style?: React.CSSProperties;
  subtitle?: string;
  subtitleHref?: string;
  title?: string;
  titleHref?: string;
}

export default function Page({
  children,
  folders,
  hideFooter,
  isFullScreen,
  style,
  subtitle,
  subtitleHref,
  title,
  titleHref,
}: PageProps) {
  const { deviceInfo, game, showNav } = useContext(AppContext);
  const [preventKeyDownEvent, setPreventKeyDownEvent] = useState(false);
  const router = useRouter();
  const [showHeader, setShowHeader] = useState(true);
  const [modal, setModal] = useState<JSX.Element | null>(null);
  const isNavDropdown = deviceInfo.screenSize < ScreenSize.XL || isFullScreen;
  const isNavOnPage = !isNavDropdown && showNav && (!game.isNotAGame || router.pathname !== '/');

  useEffect(() => {
    if (isFullScreen) {
      document.body.classList.add('touch-pinch-zoom');
    } else {
      document.body.classList.remove('touch-pinch-zoom');
    }

    return () => {
      document.body.classList.remove('touch-pinch-zoom');
    };
  }, [isFullScreen]);

  return (
    <PageContext.Provider value={{
      preventKeyDownEvent: preventKeyDownEvent,
      setPreventKeyDownEvent: setPreventKeyDownEvent,
      setShowHeader: setShowHeader,
      showHeader: showHeader,
      setModal: setModal,
      modal: modal,
    }}>
      <div
        className={classNames('flex flex-col', { 'fixed inset-0 overflow-hidden': isFullScreen })}
        style={style}
      >
        {modal !== null && modal}
        {showHeader &&
          <Header
            folders={folders}
            isFullScreen={isFullScreen}
            subtitle={subtitle ? new LinkInfo(subtitle, subtitleHref) : undefined}
            title={title ? new LinkInfo(title, titleHref) : undefined}
          />
        }
        <div className='grow flex' style={{
          height: showHeader ? `calc(100% - ${Dimensions.MenuHeight}px)` : '100%',
          marginTop: showHeader ? Dimensions.MenuHeight : 0,
        }}>
          {isNavOnPage && <Nav />}
          <div
            className={classNames('flex flex-col gap-4', { 'ml-60': isNavOnPage })}
            style={{
              maxWidth: !isNavOnPage ? '100%' : 'calc(100% - 240px)',
              width: !isNavOnPage ? '100%' : 'calc(100% - 240px)',
            }}
          >
            <main className='grow h-full'>
              {children}
            </main>
            {!isFullScreen && !hideFooter && <Footer />}
          </div>
        </div>
      </div>
    </PageContext.Provider>
  );
}
