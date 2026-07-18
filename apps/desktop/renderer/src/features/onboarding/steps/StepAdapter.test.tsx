import { formatAdapterError } from './StepAdapter';

test('turns a missing Codex executable stack trace into actionable copy', () => {
  const error = formatAdapterError(
    'codex exited with code 1: Error: spawn /opt/homebrew/lib/codex ENOENT at ChildProcess._handle.onexit',
    'codex'
  );

  expect(error).toEqual({
    title: 'Codex installation is incomplete',
    detail: 'The CLI launcher was found, but the executable it needs is missing.',
    action: 'Reinstall Codex, then test the adapter again.',
  });
});

test('turns authentication failures into login guidance', () => {
  const error = formatAdapterError('Failed to authenticate. API Error: 403 Forbidden', 'claude');

  expect(error.title).toBe('Claude Code could not sign in');
  expect(error.action).toContain('`claude login`');
});
