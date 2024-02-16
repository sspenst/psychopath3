import TileType from '@root/constants/tileType';
import isPro from '@root/helpers/isPro';
import Image from 'next/image';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import React, { useContext, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Theme, { getIconFromTheme } from '../../constants/theme';
import { AppContext } from '../../contexts/appContext';
import { ThemeIconProps } from '../theme/monkey';
import Modal from '.';

const varLabelMap = {
  '--bg-color': 'Background',
  '--bg-color-2': 'Background 2',
  '--bg-color-3': 'Background 3',
  '--bg-color-4': 'Background 4',
  '--color': 'Text',
  '--color-complete': 'Complete',
  '--color-error': 'Error',
  '--color-gray': 'Gray',
  '--color-incomplete': 'Incomplete',
  '--level-block': 'Level Block',
  '--level-block-border': 'Level Block Border',
  '--level-end': 'Level End',
  '--level-grid': 'Level Grid',
  '--level-grid-text': 'Level Grid Text',
  '--level-grid-used': 'Level Grid Used',
  '--level-hole': 'Level Hole',
  '--level-hole-border': 'Level Hole Border',
  '--level-player': 'Level Player',
  '--level-player-extra': 'Level Player Extra',
  '--level-player-text': 'Level Player Text',
  '--level-wall': 'Level Wall',
} as Record<string, string>;

const rgbToHex = (rgb: string) => {
  if (!rgb) return '#000000'; // Default color
  // if already in hex format, return
  if (rgb.indexOf('#') === 0) return rgb;

  const [r, g, b] = rgb.match(/\d+/g)?.map(Number) || [];

  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
};

// Function to fetch current CSS variable value in Hex format
const getCssVariableValue = (varName: string) => {
  const rgbValue = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();

  return rgbToHex(rgbValue);
};

interface ThemeModalProps {
  closeModal: () => void;
  isOpen: boolean;
}

export default function ThemeModal({ closeModal, isOpen }: ThemeModalProps) {
  const { game, mutateUser, user, userConfig } = useContext(AppContext);
  const { setTheme, theme } = useTheme();
  const [activeTab, setActiveTab] = useState(theme === Theme.Custom ? 'Custom' : 'Presets');
  const isProUser = isPro(user);

  // TODO: update this when theme is changed? so that when you switch to custom tab it keeps the colors
  const [customColors, setCustomColors] = useState<Record<string, string>>({});

  // override theme with userConfig theme
  useEffect(() => {
    if (!userConfig?.theme) {
      return;
    }

    // use the userConfig custom theme if it exists, otherwise init with the current css variables
    const customTheme = userConfig?.customTheme ? JSON.parse(userConfig.customTheme) : {};
    const initCustomColors = {} as Record<string, string>;

    for (const key of Object.keys(varLabelMap)) {
      let value = getCssVariableValue(key);

      if (customTheme[key]) {
        value = customTheme[key];
      }

      if (userConfig.theme === Theme.Custom) {
        document.documentElement.style.setProperty(key, value);
      }

      initCustomColors[key] = value;
    }

    setCustomColors(initCustomColors);

    if (Object.values(Theme).includes(userConfig.theme as Theme) && theme !== userConfig.theme) {
      setTheme(userConfig.theme);
    }
  // NB: we only want this to run when the userConfig changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userConfig?.customTheme, userConfig?.theme]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme-dark', theme === Theme.Light ? 'false' : 'true');
  }, [theme]);

  // set theme while handling custom theme style properties
  function setThemeWrapper(theme: Theme) {
    if (theme === Theme.Custom) {
      for (const key of Object.keys(varLabelMap)) {
        document.documentElement.style.setProperty(key, customColors[key]);
      }
    } else {
      for (const key of Object.keys(varLabelMap)) {
        document.documentElement.style.removeProperty(key);
      }
    }

    setTheme(theme);
  }

  function putTheme() {
    fetch('/api/user-config', {
      method: 'PUT',
      body: JSON.stringify({
        customTheme: isProUser ? JSON.stringify(customColors) : undefined,
        theme: theme,
      }),
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
    }).then(() => {
      mutateUser();
    }).catch(err => {
      console.error(err);
    });
  }

  const updateColor = (key: string, value: string) => {
    setCustomColors(prevCustomColors => {
      const newCustomColors = { ...prevCustomColors };

      newCustomColors[key] = value;
      document.documentElement.style.setProperty(key, value);

      return newCustomColors;
    });
  };

  return (
    <Modal
      closeModal={() => {
        closeModal();
        putTheme();
      }}
      isOpen={isOpen}
      title='Theme'
    >
      {isProUser &&
        <div className='flex justify-center gap-2'>
          <button
            className={`px-3 py-1.5 rounded-md tab ${activeTab === 'Presets' ? 'bg-2' : 'bg-1'} focus:outline-none`}
            onClick={() => setActiveTab('Presets')}
          >
            Presets
          </button>
          <button
            className={`px-3 py-1.5 rounded-md tab ${activeTab === 'Custom' ? 'bg-2' : 'bg-1'} focus:outline-none`}
            onClick={() => {
              setThemeWrapper(Theme.Custom);
              setActiveTab('Custom');
            }}
          >
            <div className='flex gap-2'>
              Custom
            </div>
          </button>
        </div>
      }
      {activeTab === 'Presets' && (
        <div className='flex flex-col gap-1'>
          {Object.keys(Theme).map(themeTextStr => {
            const themeText = themeTextStr as keyof typeof Theme;
            const icon = getIconFromTheme(game, Theme[themeText], TileType.Player);
            const id = `theme-${Theme[themeText]}`;
            const isProTheme = Theme[themeText] === Theme.Custom;

            return (
              <div className='flex items-center gap-2' key={`${Theme[themeText]}-parent-div`}>
                <input
                  checked={theme === Theme[themeText]}
                  disabled={isProTheme && !isProUser}
                  id={id}
                  onChange={e => setThemeWrapper(e.currentTarget.value as Theme)}
                  type='radio'
                  value={Theme[themeText]}
                />
                <label htmlFor={id}>
                  {themeText}
                </label>
                {icon &&
                  <span>
                    {icon({ size: 24 } as ThemeIconProps)}
                  </span>
                }
                {isProTheme && !isProUser &&
                  <Link href='/settings/pro'>
                    <Image alt='pro' src='/pro.svg' width={16} height={16} style={{ minWidth: 16, minHeight: 16 }} />
                  </Link>
                }
              </div>
            );
          })}
        </div>
      )}
      {activeTab === 'Custom' && (<>
        <div className='max-h-[350px] overflow-y-auto px-3'>
          {Object.keys(customColors).map((key) => (
            <div key={key} className='flex items-center justify-between my-2'>
              <label className='mr-2'>{varLabelMap[key]}</label>
              <input
                onChange={(e) => updateColor(key, e.target.value)}
                type='color'
                value={customColors[key]}
              />
            </div>
          ))}
        </div>
        <div className='flex justify-around min-w-80 text-sm gap-3 p-3'>
          <button
            className='bg-blue-700 text-white rounded-md px-2 py-1 h-fit'
            onClick={() => {
              navigator.clipboard.writeText(JSON.stringify(customColors));
              toast.dismiss();
              toast.success('Copied theme to clipboard!');
            }}
          >
            Export
          </button>
          <details>
            <summary className='bg-white text-black rounded-md px-2 py-1'>Import</summary>
            <textarea
              className='w-full h-20 bg-white-text-black text-xs'
              placeholder='Paste exported theme here'
            />
            <button
              className='bg-blue-700 text-white rounded-md px-2 py-1'
              onClick={() => {
                if (confirm('Are you sure you want to import this theme? This will override your current theme.')) {
                  // TODO: reimplement

                  // try {
                  //   const el = document.querySelector('.customize-content textarea') as HTMLTextAreaElement;
                  //   const newSettings = JSON.parse(el?.value || '');

                  //   // only include settings that are in the colorSettings label
                  //   for (const key in newSettings) {
                  //     if (colorSettings.find(i => i.varName === key)) {
                  //       newSettings[key] = newSettings[key].toUpperCase();
                  //     } else {
                  //       delete newSettings[key];
                  //     }
                  //   }

                  //   for (const setting of colorSettings) {
                  //     const index = colorSettings.findIndex(i => i.varName === setting.varName);

                  //     // make sure this is a color
                  //     if (!setting.value.match(/^#[0-9A-F]{6}$/i)) {
                  //       throw new Error('Invalid color');
                  //     }

                  //     updateColor(setting.varName, setting.value);
                  //   }

                  //   toast.success('Imported theme successfully');
                  // } catch (e) {
                  //   toast.error('Invalid theme');
                  // }
                }
              }}
            >
              Import
            </button>
          </details>
        </div>
      </>)}
    </Modal>
  );
}
