const POWERSHELL_BRIDGE = [
  '$target = $args[0]',
  '$targetArgs = if ($args.Count -gt 1) { $args[1..($args.Count - 1)] } else { @() }',
  '& $target @targetArgs',
  'if ($null -ne $LASTEXITCODE) { exit $LASTEXITCODE }'
].join('; ');

export function buildPtyProcess(executable, args, platform = process.platform) {
  if (platform !== 'win32') return { executable, args };

  return {
    executable: 'powershell.exe',
    args: [
      '-NoLogo',
      '-NoProfile',
      '-NonInteractive',
      '-Command',
      POWERSHELL_BRIDGE,
      executable,
      ...args
    ]
  };
}
