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

import {AllHTMLAttributes} from 'react';
import {DOMProps} from '@react-types/shared';
import {ProgressBarBaseProps} from '@react-types/progress';
import {useProgressBar} from '@react-aria/progress';

interface MeterAria {
  meterProps: AllHTMLAttributes<HTMLDivElement>,
  labelProps: AllHTMLAttributes<HTMLLabelElement>
}

interface MeterAriaProps extends ProgressBarBaseProps, DOMProps {
  textValue?: string
}

export function useMeter(props: MeterAriaProps): MeterAria {
  let {progressBarProps, labelProps} = useProgressBar(props);

  return {
    meterProps: {
      ...progressBarProps,
      // Use the meter role if available, but fall back to progressbar if not
      // Chrome currently falls back from meter automatically, and Firefox
      // does not support meter at all. Safari 13+ seems to support meter properly.
      // https://bugs.chromium.org/p/chromium/issues/detail?id=944542
      // https://bugzilla.mozilla.org/show_bug.cgi?id=1460378
      role: 'meter progressbar'
    },
    labelProps
  };
}
