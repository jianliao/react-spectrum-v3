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

import {DOMProps, InputBase, StyleProps} from '@react-types/shared';
import {ReactNode} from 'react';

export interface CheckboxBase extends InputBase {
  children?: ReactNode, // pass in children to render label
  defaultSelected?: boolean,
  isSelected?: boolean,
  onChange?: (isSelected: boolean) => void,
  value?: string, // dom prop for input element
  name?: string
}

export interface CheckboxProps extends CheckboxBase {
  /**
   * Indeterminism is presentational, when a checkbox is indeterminate, it overrides the selection state.
   * The indeterminate visual representation remains even after subsequent clicks .
   */
  isIndeterminate?: boolean
}

export interface SpectrumCheckboxProps extends CheckboxProps, DOMProps, StyleProps {
  /**
   * By default, checkboxes are not emphasized (gray).
   * This prop sets the emphasized style (blue) which provides visual prominence.
   */
  isEmphasized?: boolean
}
