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

import {action} from '@storybook/addon-actions';
import Bell from '@spectrum-icons/workflow/Bell';
import {Button} from '../';
import React from 'react';
import {storiesOf} from '@storybook/react';

storiesOf('Button', module)
  .addParameters({providerSwitcher: {status: 'positive'}})
  .add(
    'variant: cta',
    () => render({variant: 'cta'})
  )
  .add(
    'with icon',
    () => render({icon: <Bell />, variant: 'primary'})
  )
  .add(
    'variant: overBackground',
    () => (
      <div style={{backgroundColor: 'rgb(15, 121, 125)', color: 'rgb(15, 121, 125)', padding: '15px 20px', display: 'inline-block'}}>
        {render({variant: 'overBackground'})}
      </div>
    )
  )
  .add(
    'variant: primary',
    () => render({variant: 'primary'})
  )
  .add(
    'variant: secondary',
    () => render({variant: 'secondary'})
  )
  .add(
    'variant: negative',
    () => render({variant: 'negative'})
  )
  .add(
    'element: a',
    () => render({elementType: 'a', variant: 'primary'})
  )
  .add(
    'element: a, href: \'//example.com\', target: \'_self\'',
    () => render({elementType: 'a', href: '//example.com', target: '_self', variant: 'primary'})
  );

function render(props: any = {}) {
  return (
    <div>
      <Button
        onPress={action('press')}
        onPressStart={action('pressstart')}
        onPressEnd={action('pressend')}
        {...props}>
        Default
      </Button>
      <Button
        onPress={action('press')}
        onPressStart={action('pressstart')}
        onPressEnd={action('pressend')}
        isDisabled
        {...props}>
        Disabled
      </Button>
      {props.variant !== 'cta' && (
      <Button
        onPress={action('press')}
        onPressStart={action('pressstart')}
        onPressEnd={action('pressend')}
        isQuiet
        {...props}>
        Quiet
      </Button>
      )}
    </div>
  );
}
