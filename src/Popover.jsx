import React, { Component } from 'react';
import classNames from 'classnames';
import TetherDropComponent from './internal/TetherDropComponent';

import DialogHeader from './internal/DialogHeader';
import { getVariantIcon } from './utils/icon-variant';
import { getTetherPositionFromPlacement } from './utils/tether';

import './Popover.styl';

export default class Popover extends Component {
  static defaultProps = {
    variant: 'default', // default, error, warning, success, info, help
    open: false,
    closable: false,
    placement: 'right', // right, left, top, bottom
    onClose: () => {}
  };

  render() {
    const {
      closable,
      variant,
      icon = variant ? getVariantIcon(variant) : null,
      open,
      title,
      placement,
      content,
      children,
      className,
      onClose,
      ...otherProps
    } = this.props;

    return (
      <TetherDropComponent
        position={ getTetherPositionFromPlacement(placement) }
        open={ open }
        classPrefix="coral-Popover-drop"
        content={
          <div
            className={
              classNames(
                'coral3-Popover',
                `coral-Dialog--${ variant }`,
                {
                  'is-open': open
                },
                className
              )
            }
            { ...otherProps }
          >
            {
              title &&
                <DialogHeader
                  title={ title }
                  icon={ icon }
                  closable={ closable }
                  onClose={ onClose }
                />
            }
            <div className="coral3-Popover-content">{ content }</div>
          </div>
        }
        onClickOutside={ onClose }
      >
        { children }
      </TetherDropComponent>
    );
  }
}