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

import {DOMProps, PointerType, PressEvents} from '@react-types/shared';
import {HTMLAttributes, RefObject, useContext, useEffect, useMemo, useRef, useState} from 'react';
import {mergeProps} from '@react-aria/utils';
import {PressResponderContext} from './context';

export interface PressProps extends PressEvents {
  isPressed?: boolean,
  isDisabled?: boolean
}

export interface PressHookProps extends PressProps, DOMProps {
  ref?: RefObject<HTMLElement>
}

interface PressState {
  isPressed: boolean,
  ignoreEmulatedMouseEvents: boolean,
  ignoreClickAfterPress: boolean,
  activePointerId: any,
  target: HTMLElement | null,
  isOverTarget: boolean
}

interface EventBase {
  target: EventTarget,
  shiftKey: boolean,
  ctrlKey: boolean,
  metaKey: boolean
}

interface PressResult {
  isPressed: boolean,
  pressProps: HTMLAttributes<HTMLElement>
}

function usePressResponderContext(props: PressHookProps): PressHookProps {
  // Consume context from <PressResponder> and merge with props.
  let context = useContext(PressResponderContext);
  if (context) {
    let {register, ...contextProps} = context;
    props = mergeProps(contextProps, props) as PressHookProps;
    register();
  }

  // Sync ref from <PressResponder> with ref passed to usePress.
  useEffect(() => {
    if (context && context.ref) {
      context.ref.current = props.ref.current;
      return () => {
        context.ref.current = null;
      };
    }
  }, [context, props.ref]);

  return props;
}

export function usePress(props: PressHookProps): PressResult {
  let {
    onPress,
    onPressChange,
    onPressStart,
    onPressEnd,
    isDisabled,
    isPressed: isPressedProp,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ref: _, // Removing `ref` from `domProps` because TypeScript is dumb
    ...domProps
  } = usePressResponderContext(props);

  let [isPressed, setPressed] = useState(false);
  let ref = useRef<PressState>({
    isPressed: false,
    ignoreEmulatedMouseEvents: false,
    ignoreClickAfterPress: false,
    activePointerId: null,
    target: null,
    isOverTarget: false
  });

  let pressProps = useMemo(() => {
    let state = ref.current;
    let triggerPressStart = (originalEvent: EventBase, pointerType: PointerType) => {
      if (isDisabled) {
        return;
      }

      if (onPressStart) {
        onPressStart({
          type: 'pressstart',
          pointerType,
          target: originalEvent.target as HTMLElement,
          shiftKey: originalEvent.shiftKey,
          metaKey: originalEvent.metaKey,
          ctrlKey: originalEvent.ctrlKey
        });
      }

      if (onPressChange) {
        onPressChange(true);
      }

      setPressed(true);
    };

    let triggerPressEnd = (originalEvent: EventBase, pointerType: PointerType, wasPressed = true) => {
      if (isDisabled) {
        return;
      }

      state.ignoreClickAfterPress = true;

      if (onPressEnd) {
        onPressEnd({
          type: 'pressend',
          pointerType,
          target: originalEvent.target as HTMLElement,
          shiftKey: originalEvent.shiftKey,
          metaKey: originalEvent.metaKey,
          ctrlKey: originalEvent.ctrlKey
        });
      }

      if (onPressChange) {
        onPressChange(false);
      }

      setPressed(false);

      if (onPress && wasPressed) {
        onPress({
          type: 'press',
          pointerType,
          target: originalEvent.target as HTMLElement,
          shiftKey: originalEvent.shiftKey,
          metaKey: originalEvent.metaKey,
          ctrlKey: originalEvent.ctrlKey
        });
      }
    };

    let pressProps: HTMLAttributes<HTMLElement> = {
      onKeyDown(e) {
        if (isValidKeyboardEvent(e.nativeEvent)) {
          e.preventDefault();
          e.stopPropagation();
          // If the target is a link,
          // defer triggering pressStart until onClick event handler.
          if (isHTMLAnchorLink(e.target as HTMLElement) ||
            (e.target as HTMLElement).getAttribute('role') === 'link') {
            return;
          }
          if (!state.isPressed) {
            state.isPressed = true;
            triggerPressStart(e, 'keyboard');
          }
        }
      },
      onKeyUp(e) {
        if (isValidKeyboardEvent(e.nativeEvent)) {
          e.preventDefault();
          e.stopPropagation();
          // If the target is a link, trigger the click method to open the URL,
          // but defer triggering pressEnd until onClick event handler.
          if (isHTMLAnchorLink(e.target as HTMLElement) ||
            (e.target as HTMLElement).getAttribute('role') === 'link') {
            (e.target as HTMLElement).click();
            return;
          }
          if (state.isPressed) {
            state.isPressed = false;
            triggerPressEnd(e, 'keyboard');
          }
        }
      },
      onClick(e) {
        if (e) {
          e.stopPropagation();
          if (isDisabled) {
            e.preventDefault();
          }

          // If triggered from a screen reader or by using element.click(),
          // trigger as if it were a keyboard click.
          if (!state.ignoreClickAfterPress && !state.ignoreEmulatedMouseEvents && isVirtualClick(e.nativeEvent)) {
            triggerPressStart(e, 'keyboard');
            triggerPressEnd(e, 'keyboard');
          }

          state.ignoreEmulatedMouseEvents = false;
          state.ignoreClickAfterPress = false;
        }
      }
    };

    if (typeof PointerEvent !== 'undefined') {
      pressProps.onPointerDown = (e) => {
        e.stopPropagation();
        if (!state.isPressed) {
          state.isPressed = true;
          state.isOverTarget = true;
          state.activePointerId = e.pointerId;
          state.target = e.currentTarget;
          triggerPressStart(e, e.pointerType);

          document.addEventListener('pointermove', onPointerMove, false);
          document.addEventListener('pointerup', onPointerUp, false);
          document.addEventListener('pointercancel', onPointerCancel, false);
        }
      };

      let unbindEvents = () => {
        document.removeEventListener('pointermove', onPointerMove, false);
        document.removeEventListener('pointerup', onPointerUp, false);
        document.removeEventListener('pointercancel', onPointerCancel, false);
      };

      // Safari on iOS < 13.2 does not implement pointerenter/pointerleave events correctly.
      // Use pointer move events instead to implement our own hit testing.
      // See https://bugs.webkit.org/show_bug.cgi?id=199803
      let onPointerMove = (e: PointerEvent) => {
        if (e.pointerId !== state.activePointerId) {
          return;
        }

        let rect = state.target.getBoundingClientRect();
        if (e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom) {
          if (!state.isOverTarget) {
            state.isOverTarget = true;
            triggerPressStart(createEvent(state.target, e), e.pointerType as PointerType);
          }
        } else if (state.isOverTarget) {
          state.isOverTarget = false;
          triggerPressEnd(createEvent(state.target, e), e.pointerType as PointerType, false);
        }
      };

      let onPointerUp = (e: PointerEvent) => {
        if (e.pointerId === state.activePointerId && state.isPressed) {
          let rect = state.target.getBoundingClientRect();
          if (e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom) {
            triggerPressEnd(createEvent(state.target, e), e.pointerType as PointerType);
          } else if (state.isOverTarget) {
            triggerPressEnd(createEvent(state.target, e), e.pointerType as PointerType, false);
          }

          state.isPressed = false;
          state.isOverTarget = false;
          state.activePointerId = null;
          unbindEvents();
        }
      };

      let onPointerCancel = (e: PointerEvent) => {
        if (state.isPressed) {
          if (state.isOverTarget) {
            triggerPressEnd(createEvent(state.target, e), e.pointerType as PointerType, false);
          }
          state.isPressed = false;
          state.isOverTarget = false;
          state.activePointerId = null;
          unbindEvents();
        }
      };
    } else {
      pressProps.onMouseDown = (e) => {
        e.stopPropagation();
        if (state.ignoreEmulatedMouseEvents) {
          e.nativeEvent.preventDefault();
          return;
        }

        state.isPressed = true;
        state.target = e.currentTarget;
        triggerPressStart(e, 'mouse');

        document.addEventListener('mouseup', onMouseUp, false);
      };

      pressProps.onMouseEnter = (e) => {
        e.stopPropagation();
        if (state.isPressed && !state.ignoreEmulatedMouseEvents) {
          triggerPressStart(e, 'mouse');
        }
      };

      pressProps.onMouseLeave = (e) => {
        e.stopPropagation();
        if (state.isPressed && !state.ignoreEmulatedMouseEvents) {
          triggerPressEnd(e, 'mouse', false);
        }
      };

      let onMouseUp = (e: MouseEvent) => {
        state.isPressed = false;
        document.removeEventListener('mouseup', onMouseUp, false);

        if (state.ignoreEmulatedMouseEvents || !state.target || !state.target.contains(e.target as HTMLElement)) {
          state.ignoreEmulatedMouseEvents = false;
          return;
        }

        triggerPressEnd(createEvent(state.target, e), 'mouse');
      };

      pressProps.onTouchStart = (e) => {
        e.stopPropagation();
        let touch = getTouchFromEvent(e.nativeEvent);
        if (!touch) {
          return;
        }
        state.activePointerId = touch.identifier;
        state.ignoreEmulatedMouseEvents = true;
        state.isOverTarget = true;
        state.isPressed = true;
        triggerPressStart(e, 'touch');
      };

      pressProps.onTouchMove = (e) => {
        e.stopPropagation();
        let rect = e.currentTarget.getBoundingClientRect();
        let touch = getTouchById(e.nativeEvent, state.activePointerId);
        if (touch && touch.clientX >= rect.left && touch.clientX <= rect.right && touch.clientY >= rect.top && touch.clientY <= rect.bottom) {
          if (!state.isOverTarget) {
            state.isOverTarget = true;
            triggerPressStart(e, 'touch');
          }
        } else if (state.isOverTarget) {
          state.isOverTarget = false;
          triggerPressEnd(e, 'touch', false);
        }
      };

      pressProps.onTouchEnd = (e) => {
        e.stopPropagation();
        let rect = e.currentTarget.getBoundingClientRect();
        let touch = getTouchById(e.nativeEvent, state.activePointerId);
        if (touch && touch.clientX >= rect.left && touch.clientX <= rect.right && touch.clientY >= rect.top && touch.clientY <= rect.bottom) {
          triggerPressEnd(e, 'touch');
        } else if (state.isOverTarget) {
          triggerPressEnd(e, 'touch', false);
        }

        state.isPressed = false;
        state.activePointerId = null;
        state.isOverTarget = false;
      };

      pressProps.onTouchCancel = (e) => {
        e.stopPropagation();
        if (state.isPressed) {
          if (state.isOverTarget) {
            triggerPressEnd(e, 'touch', false);
          }
          state.isPressed = false;
          state.activePointerId = null;
          state.isOverTarget = false;
        }
      };
    }

    return pressProps;
  }, [onPress, onPressStart, onPressEnd, onPressChange, isDisabled]);

  return {
    isPressed: isPressedProp || isPressed,
    pressProps: mergeProps(domProps, pressProps)
  };
}

function isHTMLAnchorLink(target: HTMLElement): boolean {
  return target.tagName === 'A' && target.hasAttribute('href');
}

function isValidKeyboardEvent(event: KeyboardEvent): boolean {
  const {key, target} = event;
  const element = target as HTMLElement;
  const {tagName, isContentEditable} = element;
  const role = element.getAttribute('role');
  // Accessibility for keyboards. Space and Enter only.
  // "Spacebar" is for IE 11
  return (
    (key === 'Enter' || key === ' ' || key === 'Spacebar') &&
    (tagName !== 'INPUT' &&
      tagName !== 'TEXTAREA' &&
      isContentEditable !== true) &&
    // A link with a valid href should be handled natively,
    // unless it also has role='button' and was triggered using Space.
    (!isHTMLAnchorLink(element) || (role === 'button' && key !== 'Enter')) &&
    // An element with role='link' should only trigger with Enter key
    !(role === 'link' && key !== 'Enter')
  );
}

// Per: https://github.com/facebook/react/blob/3c713d513195a53788b3f8bb4b70279d68b15bcc/packages/react-interactions/events/src/dom/shared/index.js#L74-L87
// Keyboards, Assitive Technologies, and element.click() all produce a "virtual"
// click event. This is a method of inferring such clicks. Every browser except
// IE 11 only sets a zero value of "detail" for click events that are "virtual".
// However, IE 11 uses a zero value for all click events. For IE 11 we rely on
// the quirk that it produces click events that are of type PointerEvent, and
// where only the "virtual" click lacks a pointerType field.
function isVirtualClick(event: MouseEvent | PointerEvent): boolean {
  // JAWS/NVDA with Firefox.
  if ((event as any).mozInputSource === 0 && event.isTrusted) {
    return true;
  }

  return event.detail === 0 && !(event as PointerEvent).pointerType;
}

function getTouchFromEvent(event: TouchEvent): Touch | null {
  const {targetTouches} = event;
  if (targetTouches.length > 0) {
    return targetTouches[0];
  }
  return null;
}

function getTouchById(
  event: TouchEvent,
  pointerId: null | number
): null | Touch {
  const changedTouches = event.changedTouches;
  for (let i = 0; i < changedTouches.length; i++) {
    const touch = changedTouches[i];
    if (touch.identifier === pointerId) {
      return touch;
    }
  }
  return null;
}

function createEvent(target: HTMLElement, e: EventBase): EventBase {
  return {
    target,
    shiftKey: e.shiftKey,
    ctrlKey: e.ctrlKey,
    metaKey: e.metaKey
  };
}
