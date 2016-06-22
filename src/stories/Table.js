import React from 'react';
import { storiesOf } from '@kadira/storybook';

import Table from '../Table';
import THead from '../THead';
import TBody from '../TBody';
import TR from '../TR';
import TH from '../TH';
import TD from '../TD';

storiesOf('Table', module)
  .add('Default', () => render())
  .add('hover: true', () => render({ hover: true }))
  .add('bordered: true', () => render({ bordered: true }));

function render(props = {}) {
  return (
    <Table { ...props }>
      <THead>
        <TR>
          <TH>Pet Name</TH>
          <TH>Type</TH>
          <TH>Good/Bad</TH>
        </TR>
      </THead>
      <TBody>
        <TR>
          <TD>Mongo</TD>
          <TD>Chihuahua</TD>
          <TD>Bad</TD>
        </TR>
        <TR>
          <TD>Tiny</TD>
          <TD>Great Dane</TD>
          <TD>Bad</TD>
        </TR>
        <TR>
          <TD>Jaws</TD>
          <TD>Pit Bull</TD>
          <TD>Good</TD>
        </TR>
      </TBody>
    </Table>
  );
}