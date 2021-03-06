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
import {Dialog} from '@react-spectrum/dialog';
import {Popover} from '../';
import React from 'react';
import V2Popover from '@react/react-spectrum/Popover';

function PopoverWithDialog({children}) {
  return (
    <Popover>
      <Dialog>{children}</Dialog>
    </Popover>
  );
}
 
describe('Popover', function () {
  afterEach(cleanup);

  beforeEach(() => {
    jest.spyOn(window, 'requestAnimationFrame').mockImplementation(cb => cb());
  });
  
  afterEach(() => {
    window.requestAnimationFrame.mockRestore();
  });

  describe('v2/3 parity', function () {
    it.each`
      Name      | Component            | props                | expectedTabIndex
      ${'v3'}   | ${PopoverWithDialog} | ${{}}                | ${'-1'}
      ${'v2'}   | ${V2Popover}         | ${{role: 'dialog'}}  | ${'1'}
    `('$Name has a tabIndex set', function ({Component, props, expectedTabIndex}) {
      let {getByRole} = render(<Component {...props} />);

      let dialog = getByRole('dialog');
      expect(dialog).toHaveAttribute('tabIndex', expectedTabIndex);
    });

    it.each`
      Name      | Component            | props
      ${'v3'}   | ${PopoverWithDialog} | ${{}}
      ${'v2'}   | ${V2Popover}         | ${{role: 'dialog'}}
    `('$Name auto focuses the first tabbable element by default', function ({Component, props}) {
      let {getByTestId} = render(
        <Component {...props}>
          <input data-testid="input1" />
          <input data-testid="input2" />
        </Component>
      );

      let input1 = getByTestId('input1');
      expect(document.activeElement).toBe(input1);
    });

    it.each`
      Name      | Component            | props
      ${'v3'}   | ${PopoverWithDialog} | ${{isOpen: true}}
      ${'v2'}   | ${V2Popover}         | ${{role: 'dialog'}}
    `('$Name auto focuses the dialog itself if there is no focusable child', function ({Component, props}) {
      let {getByRole} = render(<Component {...props} />);
  
      let dialog = getByRole('dialog');
      expect(document.activeElement).toBe(dialog);
    });

    it.each`
      Name      | Component            | props
      ${'v3'}   | ${PopoverWithDialog} | ${{}}
      ${'v2'}   | ${V2Popover}         | ${{role: 'dialog'}}
    `('$Name allows autofocus prop on a child element to work as expected', function ({Component, props}) {
      let {getByTestId} = render(
        <Component {...props}>
          <input data-testid="input1" />
          <input data-testid="input2" autoFocus />
        </Component>
      );

      let input2 = getByTestId('input2');
      expect(document.activeElement).toBe(input2);
    });

    it.each`
      Name      | Component            | props
      ${'v3'}   | ${PopoverWithDialog} | ${{}}
      ${'v2'}   | ${V2Popover}         | ${{role: 'dialog'}}
    `('$Name contains focus within the popover', function ({Component, props}) {
      let {getByTestId} = render(
        <Component {...props}>
          <input data-testid="input1" />
          <input data-testid="input2" />
        </Component>
      );

      let input1 = getByTestId('input1');
      let input2 = getByTestId('input2');
      expect(document.activeElement).toBe(input1);

      fireEvent.keyDown(document.activeElement, {key: 'Tab', shiftKey: true});
      expect(document.activeElement).toBe(input2);

      fireEvent.keyDown(document.activeElement, {key: 'Tab'});
      expect(document.activeElement).toBe(input1);
    });
  });

  describe('v3', function () {
    it('hides the popover when pressing the escape key', function () {
      let onClose = jest.fn();
      let {getByTestId} = render(<Popover isOpen onClose={onClose} />);
      let popover = getByTestId('popover');
      fireEvent.keyDown(popover, {key: 'Escape'});
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('hides the popover when clicking outside', function () {
      let onClose = jest.fn();
      render(<Popover isOpen onClose={onClose} />);
      fireEvent.mouseUp(document.body);
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });
});
