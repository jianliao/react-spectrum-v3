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

import {cleanup, fireEvent, render} from '@testing-library/react';
import React from 'react';
import {usePress} from '../';

function Example(props) {
  let {elementType: ElementType = 'div', ...otherProps} = props;
  let {pressProps} = usePress(props);
  return <ElementType {...otherProps} {...pressProps}>test</ElementType>;
}

function pointerEvent(type, opts) {
  let evt = new Event(type, {bubbles: true, cancelable: true});
  Object.assign(evt, {
    ctrlKey: false,
    metaKey: false,
    shiftKey: false
  }, opts);
  return evt;
}

describe('usePress', function () {
  afterEach(cleanup);

  // TODO: JSDOM doesn't yet support pointer events. Once they do, convert these tests.
  // https://github.com/jsdom/jsdom/issues/2527
  describe('pointer events', function () {
    beforeEach(() => {
      global.PointerEvent = {};
    });

    afterEach(() => {
      delete global.PointerEvent;
    });

    it('should fire press events based on pointer events', function () {
      let events = [];
      let addEvent = (e) => events.push(e);
      let res = render(
        <Example
          onPressStart={addEvent}
          onPressEnd={addEvent}
          onPressChange={pressed => addEvent({type: 'presschange', pressed})}
          onPress={addEvent} />
      );

      let el = res.getByText('test');
      fireEvent(el, pointerEvent('pointerdown', {pointerId: 1, pointerType: 'mouse'}));
      fireEvent(el, pointerEvent('pointerup', {pointerId: 1, pointerType: 'mouse', clientX: 0, clientY: 0}));

      // How else to get the DOM node it renders the hook to?
      // let el = events[0].target;
      expect(events).toEqual([
        {
          type: 'pressstart',
          target: el,
          pointerType: 'mouse',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false
        },
        {
          type: 'presschange',
          pressed: true
        },
        {
          type: 'pressend',
          target: el,
          pointerType: 'mouse',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false
        },
        {
          type: 'presschange',
          pressed: false
        },
        {
          type: 'press',
          target: el,
          pointerType: 'mouse',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false
        }
      ]);
    });

    it('should fire press change events when moving pointer outside target', function () {
      let events = [];
      let addEvent = (e) => events.push(e);
      let res = render(
        <Example
          onPressStart={addEvent}
          onPressEnd={addEvent}
          onPressChange={pressed => addEvent({type: 'presschange', pressed})}
          onPress={addEvent} />
      );

      let el = res.getByText('test');
      fireEvent(el, pointerEvent('pointerdown', {pointerId: 1, pointerType: 'mouse'}));
      fireEvent(document, pointerEvent('pointermove', {pointerId: 1, pointerType: 'mouse', clientX: 100, clientY: 100}));
      fireEvent(document, pointerEvent('pointerup', {pointerId: 1, pointerType: 'mouse', clientX: 100, clientY: 100}));
      fireEvent(document, pointerEvent('pointermove', {pointerId: 1, pointerType: 'mouse', clientX: 0, clientY: 0}));

      expect(events).toEqual([
        {
          type: 'pressstart',
          target: el,
          pointerType: 'mouse',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false
        },
        {
          type: 'presschange',
          pressed: true
        },
        {
          type: 'pressend',
          target: el,
          pointerType: 'mouse',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false
        },
        {
          type: 'presschange',
          pressed: false
        }
      ]);

      events = [];
      fireEvent(el, pointerEvent('pointerdown', {pointerId: 1, pointerType: 'mouse'}));
      fireEvent(document, pointerEvent('pointermove', {pointerId: 1, pointerType: 'mouse', clientX: 100, clientY: 100}));
      fireEvent(document, pointerEvent('pointermove', {pointerId: 1, pointerType: 'mouse', clientX: 0, clientY: 0}));
      fireEvent(el, pointerEvent('pointerup', {pointerId: 1, pointerType: 'mouse', clientX: 0, clientY: 0}));

      expect(events).toEqual([
        {
          type: 'pressstart',
          target: el,
          pointerType: 'mouse',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false
        },
        {
          type: 'presschange',
          pressed: true
        },
        {
          type: 'pressend',
          target: el,
          pointerType: 'mouse',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false
        },
        {
          type: 'presschange',
          pressed: false
        },
        {
          type: 'pressstart',
          target: el,
          pointerType: 'mouse',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false
        },
        {
          type: 'presschange',
          pressed: true
        },
        {
          type: 'pressend',
          target: el,
          pointerType: 'mouse',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false
        },
        {
          type: 'presschange',
          pressed: false
        },
        {
          type: 'press',
          target: el,
          pointerType: 'mouse',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false
        }
      ]);
    });

    it('should handle pointer cancel events', function () {
      let events = [];
      let addEvent = (e) => events.push(e);
      let res = render(
        <Example
          onPressStart={addEvent}
          onPressEnd={addEvent}
          onPressChange={pressed => addEvent({type: 'presschange', pressed})}
          onPress={addEvent} />
      );

      let el = res.getByText('test');
      fireEvent(el, pointerEvent('pointerdown', {pointerId: 1, pointerType: 'mouse'}));
      fireEvent(document.body, pointerEvent('pointercancel', {pointerId: 1, pointerType: 'mouse'}));

      expect(events).toEqual([
        {
          type: 'pressstart',
          target: el,
          pointerType: 'mouse',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false
        },
        {
          type: 'presschange',
          pressed: true
        },
        {
          type: 'pressend',
          target: el,
          pointerType: 'mouse',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false
        },
        {
          type: 'presschange',
          pressed: false
        }
      ]);
    });

    it('should handle modifier keys', function () {
      let events = [];
      let addEvent = (e) => events.push(e);
      let res = render(
        <Example
          onPressStart={addEvent}
          onPressEnd={addEvent}
          onPressChange={pressed => addEvent({type: 'presschange', pressed})}
          onPress={addEvent} />
      );

      let el = res.getByText('test');
      fireEvent(el, pointerEvent('pointerdown', {pointerId: 1, pointerType: 'mouse', shiftKey: true}));
      fireEvent(el, pointerEvent('pointerup', {pointerId: 1, pointerType: 'mouse', ctrlKey: true, clientX: 0, clientY: 0}));

      // How else to get the DOM node it renders the hook to?
      // let el = events[0].target;
      expect(events).toEqual([
        {
          type: 'pressstart',
          target: el,
          pointerType: 'mouse',
          ctrlKey: false,
          metaKey: false,
          shiftKey: true
        },
        {
          type: 'presschange',
          pressed: true
        },
        {
          type: 'pressend',
          target: el,
          pointerType: 'mouse',
          ctrlKey: true,
          metaKey: false,
          shiftKey: false
        },
        {
          type: 'presschange',
          pressed: false
        },
        {
          type: 'press',
          target: el,
          pointerType: 'mouse',
          ctrlKey: true,
          metaKey: false,
          shiftKey: false
        }
      ]);
    });
  });

  describe('mouse events', function () {
    it('should fire press events based on mouse events', function () {
      let events = [];
      let addEvent = (e) => events.push(e);
      let res = render(
        <Example
          onPressStart={addEvent}
          onPressEnd={addEvent}
          onPressChange={pressed => addEvent({type: 'presschange', pressed})}
          onPress={addEvent} />
      );

      let el = res.getByText('test');
      fireEvent.mouseDown(el);
      fireEvent.mouseUp(el);
      fireEvent.click(el);

      expect(events).toEqual([
        {
          type: 'pressstart',
          target: el,
          pointerType: 'mouse',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false
        },
        {
          type: 'presschange',
          pressed: true
        },
        {
          type: 'pressend',
          target: el,
          pointerType: 'mouse',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false
        },
        {
          type: 'presschange',
          pressed: false
        },
        {
          type: 'press',
          target: el,
          pointerType: 'mouse',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false
        }
      ]);
    });

    it('should fire press change events when moving mouse outside target', function () {
      let events = [];
      let addEvent = (e) => events.push(e);
      let res = render(
        <Example
          onPressStart={addEvent}
          onPressEnd={addEvent}
          onPressChange={pressed => addEvent({type: 'presschange', pressed})}
          onPress={addEvent} />
      );

      let el = res.getByText('test');
      fireEvent.mouseDown(el);
      fireEvent.mouseLeave(el);
      fireEvent.mouseUp(document.body);
      fireEvent.mouseEnter(el);

      expect(events).toEqual([
        {
          type: 'pressstart',
          target: el,
          pointerType: 'mouse',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false
        },
        {
          type: 'presschange',
          pressed: true
        },
        {
          type: 'pressend',
          target: el,
          pointerType: 'mouse',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false
        },
        {
          type: 'presschange',
          pressed: false
        }
      ]);

      events = [];
      fireEvent.mouseDown(el);
      fireEvent.mouseLeave(el);
      fireEvent.mouseEnter(el);
      fireEvent.mouseUp(el);
      fireEvent.click(el);

      expect(events).toEqual([
        {
          type: 'pressstart',
          target: el,
          pointerType: 'mouse',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false
        },
        {
          type: 'presschange',
          pressed: true
        },
        {
          type: 'pressend',
          target: el,
          pointerType: 'mouse',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false
        },
        {
          type: 'presschange',
          pressed: false
        },
        {
          type: 'pressstart',
          target: el,
          pointerType: 'mouse',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false
        },
        {
          type: 'presschange',
          pressed: true
        },
        {
          type: 'pressend',
          target: el,
          pointerType: 'mouse',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false
        },
        {
          type: 'presschange',
          pressed: false
        },
        {
          type: 'press',
          target: el,
          pointerType: 'mouse',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false
        }
      ]);
    });

    it('should handle modifier keys', function () {
      let events = [];
      let addEvent = (e) => events.push(e);
      let res = render(
        <Example
          onPressStart={addEvent}
          onPressEnd={addEvent}
          onPressChange={pressed => addEvent({type: 'presschange', pressed})}
          onPress={addEvent} />
      );

      let el = res.getByText('test');
      fireEvent.mouseDown(el, {metaKey: true});
      fireEvent.mouseUp(el, {shiftKey: true});
      fireEvent.click(el);

      expect(events).toEqual([
        {
          type: 'pressstart',
          target: el,
          pointerType: 'mouse',
          ctrlKey: false,
          metaKey: true,
          shiftKey: false
        },
        {
          type: 'presschange',
          pressed: true
        },
        {
          type: 'pressend',
          target: el,
          pointerType: 'mouse',
          ctrlKey: false,
          metaKey: false,
          shiftKey: true
        },
        {
          type: 'presschange',
          pressed: false
        },
        {
          type: 'press',
          target: el,
          pointerType: 'mouse',
          ctrlKey: false,
          metaKey: false,
          shiftKey: true
        }
      ]);
    });
  });

  describe('touch events', function () {
    it('should fire press events based on touch events', function () {
      let events = [];
      let addEvent = (e) => events.push(e);
      let res = render(
        <Example
          onPressStart={addEvent}
          onPressEnd={addEvent}
          onPressChange={pressed => addEvent({type: 'presschange', pressed})}
          onPress={addEvent} />
      );

      let el = res.getByText('test');
      fireEvent.touchStart(el, {targetTouches: [{identifier: 1}]});
      fireEvent.touchEnd(el, {changedTouches: [{identifier: 1, clientX: 0, clientY: 0}]});

      expect(events).toEqual([
        {
          type: 'pressstart',
          target: el,
          pointerType: 'touch',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false
        },
        {
          type: 'presschange',
          pressed: true
        },
        {
          type: 'pressend',
          target: el,
          pointerType: 'touch',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false
        },
        {
          type: 'presschange',
          pressed: false
        },
        {
          type: 'press',
          target: el,
          pointerType: 'touch',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false
        }
      ]);
    });

    it('should fire press change events when moving touch outside target', function () {
      let events = [];
      let addEvent = (e) => events.push(e);
      let res = render(
        <Example
          onPressStart={addEvent}
          onPressEnd={addEvent}
          onPressChange={pressed => addEvent({type: 'presschange', pressed})}
          onPress={addEvent} />
      );

      let el = res.getByText('test');
      fireEvent.touchStart(el, {targetTouches: [{identifier: 1}]});
      fireEvent.touchMove(el, {changedTouches: [{identifier: 1, clientX: 100, clientY: 100}]});
      fireEvent.touchEnd(el, {changedTouches: [{identifier: 1, clientX: 100, clientY: 100}]});

      expect(events).toEqual([
        {
          type: 'pressstart',
          target: el,
          pointerType: 'touch',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false
        },
        {
          type: 'presschange',
          pressed: true
        },
        {
          type: 'pressend',
          target: el,
          pointerType: 'touch',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false
        },
        {
          type: 'presschange',
          pressed: false
        }
      ]);

      events = [];
      fireEvent.touchStart(el, {targetTouches: [{identifier: 1}]});
      fireEvent.touchMove(el, {changedTouches: [{identifier: 1, clientX: 100, clientY: 100}]});
      fireEvent.touchMove(el, {changedTouches: [{identifier: 1, clientX: 0, clientY: 0}]});
      fireEvent.touchEnd(el, {changedTouches: [{identifier: 1, clientX: 0, clientY: 0}]});

      expect(events).toEqual([
        {
          type: 'pressstart',
          target: el,
          pointerType: 'touch',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false
        },
        {
          type: 'presschange',
          pressed: true
        },
        {
          type: 'pressend',
          target: el,
          pointerType: 'touch',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false
        },
        {
          type: 'presschange',
          pressed: false
        },
        {
          type: 'pressstart',
          target: el,
          pointerType: 'touch',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false
        },
        {
          type: 'presschange',
          pressed: true
        },
        {
          type: 'pressend',
          target: el,
          pointerType: 'touch',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false
        },
        {
          type: 'presschange',
          pressed: false
        },
        {
          type: 'press',
          target: el,
          pointerType: 'touch',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false
        }
      ]);
    });

    it('should ignore emulated mouse events', function () {
      let events = [];
      let addEvent = (e) => events.push(e);
      let res = render(
        <Example
          onPressStart={addEvent}
          onPressEnd={addEvent}
          onPressChange={pressed => addEvent({type: 'presschange', pressed})}
          onPress={addEvent} />
      );

      let el = res.getByText('test');
      fireEvent.touchStart(el, {targetTouches: [{identifier: 1}]});
      fireEvent.mouseDown(el);
      fireEvent.touchMove(el, {changedTouches: [{identifier: 1, clientX: 100, clientY: 100}]});
      fireEvent.mouseLeave(el);
      fireEvent.touchMove(el, {changedTouches: [{identifier: 1, clientX: 0, clientY: 0}]});
      fireEvent.mouseEnter(el);
      fireEvent.touchEnd(el, {changedTouches: [{identifier: 1, clientX: 0, clientY: 0}]});
      fireEvent.mouseUp(el);
      fireEvent.click(el);

      expect(events).toEqual([
        {
          type: 'pressstart',
          target: el,
          pointerType: 'touch',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false
        },
        {
          type: 'presschange',
          pressed: true
        },
        {
          type: 'pressend',
          target: el,
          pointerType: 'touch',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false
        },
        {
          type: 'presschange',
          pressed: false
        },
        {
          type: 'pressstart',
          target: el,
          pointerType: 'touch',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false
        },
        {
          type: 'presschange',
          pressed: true
        },
        {
          type: 'pressend',
          target: el,
          pointerType: 'touch',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false
        },
        {
          type: 'presschange',
          pressed: false
        },
        {
          type: 'press',
          target: el,
          pointerType: 'touch',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false
        }
      ]);
    });

    it('should handle touch cancel events', function () {
      let events = [];
      let addEvent = (e) => events.push(e);
      let res = render(
        <Example
          onPressStart={addEvent}
          onPressEnd={addEvent}
          onPressChange={pressed => addEvent({type: 'presschange', pressed})}
          onPress={addEvent} />
      );

      let el = res.getByText('test');
      fireEvent.touchStart(el, {targetTouches: [{identifier: 1}]});
      fireEvent.touchCancel(el);

      expect(events).toEqual([
        {
          type: 'pressstart',
          target: el,
          pointerType: 'touch',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false
        },
        {
          type: 'presschange',
          pressed: true
        },
        {
          type: 'pressend',
          target: el,
          pointerType: 'touch',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false
        },
        {
          type: 'presschange',
          pressed: false
        }
      ]);
    });
  });

  describe('keyboard events', function () {
    it('should fire press events when the element is not a link', function () {
      let events = [];
      let addEvent = (e) => events.push(e);
      let {getByText} = render(
        <Example
          onPressStart={addEvent}
          onPressEnd={addEvent}
          onPressChange={pressed => addEvent({type: 'presschange', pressed})}
          onPress={addEvent} />
      );

      let el = getByText('test');
      fireEvent.keyDown(el, {key: ' '});
      fireEvent.keyUp(el, {key: ' '});

      expect(events).toEqual([
        {
          type: 'pressstart',
          target: el,
          pointerType: 'keyboard',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false
        },
        {
          type: 'presschange',
          pressed: true
        },
        {
          type: 'pressend',
          target: el,
          pointerType: 'keyboard',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false
        },
        {
          type: 'presschange',
          pressed: false
        },
        {
          type: 'press',
          target: el,
          pointerType: 'keyboard',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false
        }
      ]);
    });

    it('should fire press events when the element is a link', function () {
      let events = [];
      let addEvent = (e) => events.push(e);
      let {getByText} = render(
        <Example
          elementType="a"
          href="#"
          onClick={e => {e.preventDefault(); addEvent({type: 'click'});}}
          onPressStart={addEvent}
          onPressEnd={addEvent}
          onPressChange={pressed => addEvent({type: 'presschange', pressed})}
          onPress={addEvent} />
      );

      let el = getByText('test');
      fireEvent.keyDown(el, {key: ' '});
      fireEvent.keyUp(el, {key: ' '});

      // Space key handled should do nothing on a link
      expect(events).toEqual([]);

      fireEvent.keyDown(el, {key: 'Enter'});
      fireEvent.keyUp(el, {key: 'Enter'});

      // Enter key should handled natively
      expect(events).toEqual([]);

      fireEvent.click(el);

      // Click event, which is called when Enter key on a link is handled natively, should trigger a click.
      expect(events).toEqual([
        {
          type: 'click'
        },
        {
          type: 'pressstart',
          target: el,
          pointerType: 'keyboard',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false
        },
        {
          type: 'presschange',
          pressed: true
        },
        {
          type: 'pressend',
          target: el,
          pointerType: 'keyboard',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false
        },
        {
          type: 'presschange',
          pressed: false
        },
        {
          type: 'press',
          target: el,
          pointerType: 'keyboard',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false
        }
      ]);
    });

    it('should fire press events on Enter when the element role is link', function () {
      let events = [];
      let addEvent = (e) => events.push(e);
      let {getByText} = render(
        <Example
          role="link"
          onClick={e => {e.preventDefault(); addEvent({type: 'click'});}}
          onPressStart={addEvent}
          onPressEnd={addEvent}
          onPressChange={pressed => addEvent({type: 'presschange', pressed})}
          onPress={addEvent} />
      );

      let el = getByText('test');
      fireEvent.keyDown(el, {key: ' '});
      fireEvent.keyUp(el, {key: ' '});

      // Space key should do nothing on an element with role="link"
      expect(events).toEqual([]);

      fireEvent.keyDown(el, {key: 'Enter'});
      fireEvent.keyUp(el, {key: 'Enter'});

      // Enter key should trigger press events on element with role="link"
      expect(events).toEqual([
        {
          type: 'click'
        },
        {
          type: 'pressstart',
          target: el,
          pointerType: 'keyboard',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false
        },
        {
          type: 'presschange',
          pressed: true
        },
        {
          type: 'pressend',
          target: el,
          pointerType: 'keyboard',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false
        },
        {
          type: 'presschange',
          pressed: false
        },
        {
          type: 'press',
          target: el,
          pointerType: 'keyboard',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false
        }
      ]);
    });

    it('should explicitly call click method, but not fire press events, when Space key is triggered on a link with href and role="button"', function () {
      let events = [];
      let addEvent = (e) => events.push(e);
      let {getByText} = render(
        <Example
          elementType="a"
          role="button"
          href="#"
          onClick={e => {e.preventDefault(); addEvent({type: 'click'});}}
          onPressStart={addEvent}
          onPressEnd={addEvent}
          onPressChange={pressed => addEvent({type: 'presschange', pressed})}
          onPress={addEvent} />
      );

      let el = getByText('test');

      // Enter key should handled natively
      fireEvent.keyDown(el, {key: 'Enter'});
      fireEvent.keyUp(el, {key: 'Enter'});

      expect(events).toEqual([]);

      // Space key handled by explicitly calling click
      fireEvent.keyDown(el, {key: ' '});
      fireEvent.keyUp(el, {key: ' '});

      expect(events).toEqual([
        {
          type: 'click'
        },
        {
          type: 'pressstart',
          target: el,
          pointerType: 'keyboard',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false
        },
        {
          type: 'presschange',
          pressed: true
        },
        {
          type: 'pressend',
          target: el,
          pointerType: 'keyboard',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false
        },
        {
          type: 'presschange',
          pressed: false
        },
        {
          type: 'press',
          target: el,
          pointerType: 'keyboard',
          ctrlKey: false,
          metaKey: false,
          shiftKey: false
        }
      ]);
    });

    it('should handle modifier keys', function () {
      let events = [];
      let addEvent = (e) => events.push(e);
      let res = render(
        <Example
          onPressStart={addEvent}
          onPressEnd={addEvent}
          onPressChange={pressed => addEvent({type: 'presschange', pressed})}
          onPress={addEvent} />
      );

      let el = res.getByText('test');
      fireEvent.keyDown(el, {key: ' ', shiftKey: true});
      fireEvent.keyUp(el, {key: ' ', ctrlKey: true});

      expect(events).toEqual([
        {
          type: 'pressstart',
          target: el,
          pointerType: 'keyboard',
          ctrlKey: false,
          metaKey: false,
          shiftKey: true
        },
        {
          type: 'presschange',
          pressed: true
        },
        {
          type: 'pressend',
          target: el,
          pointerType: 'keyboard',
          ctrlKey: true,
          metaKey: false,
          shiftKey: false
        },
        {
          type: 'presschange',
          pressed: false
        },
        {
          type: 'press',
          target: el,
          pointerType: 'keyboard',
          ctrlKey: true,
          metaKey: false,
          shiftKey: false
        }
      ]);
    });
  });
});
