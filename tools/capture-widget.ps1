Add-Type @'
using System;
using System.Drawing;
using System.Runtime.InteropServices;
public class CapFull {
  [DllImport("user32.dll")] public static extern bool PrintWindow(IntPtr hWnd, IntPtr hdc, uint flags);
  [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr hWnd, out RECT r);
  [DllImport("user32.dll")] public static extern bool SetProcessDPIAware();
  [StructLayout(LayoutKind.Sequential)] public struct RECT { public int Left, Top, Right, Bottom; }
  public static void Shot(IntPtr h, string path) {
    SetProcessDPIAware();
    RECT r; GetWindowRect(h, out r);
    int w = r.Right - r.Left, hh = r.Bottom - r.Top;
    var bmp = new Bitmap(w, hh);
    using (var g = Graphics.FromImage(bmp)) {
      IntPtr hdc = g.GetHdc();
      PrintWindow(h, hdc, 2);
      g.ReleaseHdc(hdc);
    }
    bmp.Save(path, System.Drawing.Imaging.ImageFormat.Png);
  }
}
'@ -ReferencedAssemblies System.Drawing

$p = Get-Process electron | Where-Object { $_.MainWindowTitle } | Select-Object -First 1
[CapFull]::Shot($p.MainWindowHandle, $args[0])
Write-Output ("captured " + $args[0])
