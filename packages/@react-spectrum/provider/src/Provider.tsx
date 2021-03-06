/*
 * Copyright 2020 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import classNames from 'classnames';
import configureTypekit from './configureTypekit';
import {DOMRef} from '@react-types/shared';
import {filterDOMProps, shouldKeepSpectrumClassNames, useDOMRef, useStyleProps} from '@react-spectrum/utils';
import {Provider as I18nProvider, useLocale} from '@react-aria/i18n';
import {ModalProvider, useModalProvider} from '@react-aria/dialog';
import {ProviderContext, ProviderProps} from '@react-types/provider';
import React, {useContext, useEffect} from 'react';
import styles from '@adobe/spectrum-css-temp/components/page/vars.css';
import {ToastProvider} from '@react-spectrum/toast';
import typographyStyles from '@adobe/spectrum-css-temp/components/typography/index.css';
import {useColorScheme, useScale} from './mediaQueries';
// @ts-ignore
import {version} from '../package.json';

const Context = React.createContext<ProviderContext | null>(null);

function Provider(props: ProviderProps, ref: DOMRef<HTMLDivElement>) {
  let prevContext = useProvider();
  let {
    theme = prevContext && prevContext.theme,
    defaultColorScheme = prevContext ? prevContext.colorScheme : 'light'
  } = props;
  // Hooks must always be called.
  let autoColorScheme = useColorScheme(theme, defaultColorScheme);
  let autoScale = useScale(theme);
  let {locale: prevLocale} = useLocale();

  let {
    colorScheme = autoColorScheme,
    scale = prevContext ? prevContext.scale : autoScale,
    typekitId,
    locale = prevContext ? prevLocale : null,
    children,
    toastPlacement,
    isQuiet,
    isEmphasized,
    isDisabled,
    isRequired,
    isReadOnly,
    validationState,
    ...otherProps
  } = props;

  // Merge options with parent provider
  let context = Object.assign({}, prevContext, {
    version,
    theme,
    colorScheme,
    scale,
    toastPlacement,
    isQuiet,
    isEmphasized,
    isDisabled,
    isRequired,
    isReadOnly,
    validationState
  });

  useEffect(() => {
    configureTypekit(typekitId);
  }, [typekitId]);

  // Only wrap in a DOM node if the theme, colorScheme, or scale changed
  let contents = children;
  let domProps = filterDOMProps(otherProps);
  let {styleProps} = useStyleProps(otherProps);
  if (!prevContext || theme !== prevContext.theme || colorScheme !== prevContext.colorScheme || scale !== prevContext.scale || Object.keys(domProps).length > 0 || otherProps.UNSAFE_className || Object.keys(styleProps.style).length > 0) {
    contents = (
      <ProviderWrapper {...props} ref={ref}>
        <ToastProvider>
          {contents}
        </ToastProvider>
      </ProviderWrapper>
    );
  }

  return (
    <Context.Provider value={context}>
      <I18nProvider locale={locale}>
        <ModalProvider>
          {contents}
        </ModalProvider>
      </I18nProvider>
    </Context.Provider>
  );
}

let _Provider = React.forwardRef(Provider);
export {_Provider as Provider};

const ProviderWrapper = React.forwardRef(function ProviderWrapper({children, ...otherProps}: ProviderProps, ref: DOMRef<HTMLDivElement>) {
  let {locale, direction} = useLocale();
  let {theme, colorScheme, scale} = useProvider();
  let {modalProviderProps} = useModalProvider();
  let {styleProps} = useStyleProps(otherProps);
  let domRef = useDOMRef(ref);

  let themeKey = Object.keys(theme[colorScheme])[0];
  let scaleKey = Object.keys(theme[scale])[0];

  let className = classNames(
    styleProps.className,
    styles['spectrum'],
    typographyStyles['spectrum'],
    theme[colorScheme][themeKey],
    theme[scale][scaleKey],
    theme.global ? Object.values(theme.global) : null,
    {
      'react-spectrum-provider': shouldKeepSpectrumClassNames,
      spectrum: shouldKeepSpectrumClassNames,
      [themeKey]: shouldKeepSpectrumClassNames,
      [scaleKey]: shouldKeepSpectrumClassNames
    }
  );

  return (
    <div
      {...filterDOMProps(otherProps)}
      {...styleProps}
      {...modalProviderProps}
      className={className}
      lang={locale}
      dir={direction}
      ref={domRef}>
      {children}
    </div>
  );
});

export function useProvider(): ProviderContext {
  return useContext(Context);
}

export function useProviderProps<T>(props: T) : T {
  let context = useProvider();
  if (!context) {
    return props;
  }
  return Object.assign({}, {
    isQuiet: context.isQuiet,
    isEmphasized: context.isEmphasized,
    isDisabled: context.isDisabled,
    isRequired: context.isRequired,
    isReadOnly: context.isReadOnly,
    validationState: context.validationState
  }, props);
}
