import { renderHook, act } from '@testing-library/react';
import { ThemeProvider, useTheme } from './theme.store';

test('toggles theme and reflects on documentElement', () => {
  const { result } = renderHook(() => useTheme(), { wrapper: ThemeProvider });
  expect(result.current.theme).toBe('dark');
  act(() => result.current.toggle());
  expect(document.documentElement.getAttribute('data-theme')).toBe('light');
});
