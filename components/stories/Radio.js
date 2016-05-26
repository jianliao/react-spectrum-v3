import React from 'react';
import { storiesOf, action } from '@kadira/storybook';

import Radio from '../Radio';

storiesOf('Radio', module)
  .add('Default', () => ( render() ))
  .add('defaultChecked: true', () => ( render({ defaultChecked: true }) ))
  .add('checked: true', () => ( render({ checked: true }) ))
  .add('checked: false', () => ( render({ checked: false }) ))
  .add('disabled: true', () => ( render({ disabled: true }) ))

function render(props = {}) {
  return (
    <Radio
      label="React"
      onChange={ action('change') }
      { ...props }
    />
  );
}