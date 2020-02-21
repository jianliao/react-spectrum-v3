import {FocusEvent, HTMLAttributes, KeyboardEvent, useEffect} from 'react';
import {KeyboardDelegate} from '@react-types/shared';
import {MultipleSelectionManager} from '@react-stately/selection';

type FocusStrategy = 'first' | 'last';

const isMac =
  typeof window !== 'undefined' && window.navigator != null
    ? /^Mac/.test(window.navigator.platform)
    : false;

function isCtrlKeyPressed(e: KeyboardEvent) {
  if (isMac) {
    return e.metaKey;
  }

  return e.ctrlKey;
}

interface SelectableListOptions {
  selectionManager: MultipleSelectionManager,
  keyboardDelegate: KeyboardDelegate,
  autoFocus?: boolean,
  focusStrategy?: FocusStrategy,
  wrapAround?: boolean 
}

interface SelectableListAria {
  listProps: HTMLAttributes<HTMLElement>
}

export function useSelectableCollection(options: SelectableListOptions): SelectableListAria {
  let {
    selectionManager: manager,
    keyboardDelegate: delegate,
    autoFocus = false,
    focusStrategy,
    wrapAround = false
  } = options;

  let onKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown': {
        if (delegate.getKeyBelow) {
          e.preventDefault();
          let nextKey = delegate.getKeyBelow(manager.focusedKey);
          if (nextKey) {
            manager.setFocusedKey(nextKey);
          } else if (wrapAround) {
            manager.setFocusedKey(delegate.getFirstKey());
          }
          if (e.shiftKey && manager.selectionMode === 'multiple') {
            manager.extendSelection(nextKey);
          }
        }
        break;
      }
      case 'ArrowUp': {
        if (delegate.getKeyAbove) {
          e.preventDefault();
          let nextKey = delegate.getKeyAbove(manager.focusedKey);
          if (nextKey) {
            manager.setFocusedKey(nextKey);
          } else if (wrapAround) {
            manager.setFocusedKey(delegate.getLastKey());
          }
          if (e.shiftKey && manager.selectionMode === 'multiple') {
            manager.extendSelection(nextKey);
          }
        }
        break;
      }
      case 'ArrowLeft': {
        if (delegate.getKeyLeftOf) {
          e.preventDefault();
          let nextKey = delegate.getKeyLeftOf(manager.focusedKey);
          if (nextKey) {
            manager.setFocusedKey(nextKey);
          }
          if (e.shiftKey && manager.selectionMode === 'multiple') {
            manager.extendSelection(nextKey);
          }
        }
        break;
      }
      case 'ArrowRight': {
        if (delegate.getKeyRightOf) {
          e.preventDefault();
          let nextKey = delegate.getKeyRightOf(manager.focusedKey);
          if (nextKey) {
            manager.setFocusedKey(nextKey);
          }
          if (e.shiftKey && manager.selectionMode === 'multiple') {
            manager.extendSelection(nextKey);
          }
        }
        break;
      }
      case 'Home':
        if (delegate.getFirstKey) {
          e.preventDefault();
          let firstKey = delegate.getFirstKey();
          manager.setFocusedKey(firstKey);
          if (isCtrlKeyPressed(e) && e.shiftKey && manager.selectionMode === 'multiple') {
            manager.extendSelection(firstKey);
          }
        }
        break;
      case 'End':
        if (delegate.getLastKey) {
          e.preventDefault();
          let lastKey = delegate.getLastKey();
          manager.setFocusedKey(lastKey);
          if (isCtrlKeyPressed(e) && e.shiftKey && manager.selectionMode === 'multiple') {
            manager.extendSelection(lastKey);
          }
        }
        break;
      case 'PageDown':
        if (delegate.getKeyPageBelow) {
          e.preventDefault();
          let nextKey = delegate.getKeyPageBelow(manager.focusedKey);
          if (nextKey) {
            manager.setFocusedKey(nextKey);
            if (e.shiftKey && manager.selectionMode === 'multiple') {
              manager.extendSelection(nextKey);
            }
          }
        }
        break;
      case 'PageUp':
        if (delegate.getKeyPageAbove) {
          e.preventDefault();
          let nextKey = delegate.getKeyPageAbove(manager.focusedKey);
          if (nextKey) {
            manager.setFocusedKey(nextKey);
            if (e.shiftKey && manager.selectionMode === 'multiple') {
              manager.extendSelection(nextKey);
            }
          }
        }
        break;
      case 'a':
        if (isCtrlKeyPressed(e) && manager.selectionMode === 'multiple') {
          e.preventDefault();
          manager.selectAll();
        }
        break;
      case 'Escape':
        e.preventDefault();
        manager.clearSelection();
        break;
    }
  };

  let onFocus = (e: FocusEvent) => {
    manager.setFocused(true);
    
    if (manager.focusedKey == null && e.target === e.currentTarget) {
      // If the user hasn't yet interacted with the collection, there will be no focusedKey set.
      // Attempt to detect whether the user is tabbing forward or backward into the collection
      // and either focus the first or last item accordingly.
      let relatedTarget = e.relatedTarget as Element;
      if (relatedTarget && (e.currentTarget.compareDocumentPosition(relatedTarget) & Node.DOCUMENT_POSITION_FOLLOWING)) {
        manager.setFocusedKey(delegate.getLastKey());
      } else {
        manager.setFocusedKey(delegate.getFirstKey());
      }
    }
  };

  let onBlur = () => {
    manager.setFocused(false);
  };

  useEffect(() => {
    // By default, select first item for focus target
    let focusedKey = delegate.getFirstKey();
    let selectedKeys = manager.selectedKeys;
    manager.setFocused(true);
    
    // Set the last item as the new focus target if focusStrategy is 'last' (i.e. ArrowUp opening the menu)
    if (focusStrategy && focusStrategy === 'last') {
      focusedKey = delegate.getLastKey();
    }

    // If there are any selected keys, make the first one the new focus target
    if (selectedKeys.size) {
      focusedKey = selectedKeys.values().next().value;
    }
    
    if (autoFocus) {
      manager.setFocusedKey(focusedKey);
    }
  }, []);

  return {
    listProps: {
      onKeyDown,
      onFocus,
      onBlur
    }
  };
}
