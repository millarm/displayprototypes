import AppKit

let directory = URL(fileURLWithPath: #filePath).deletingLastPathComponent()

func color(_ hex: UInt32) -> CGColor {
  let red = CGFloat((hex >> 16) & 0xff) / 255
  let green = CGFloat((hex >> 8) & 0xff) / 255
  let blue = CGFloat(hex & 0xff) / 255
  return CGColor(red: red, green: green, blue: blue, alpha: 1)
}

func rounded(_ rect: CGRect, radius: CGFloat) -> CGPath {
  CGPath(roundedRect: rect, cornerWidth: radius, cornerHeight: radius, transform: nil)
}

func card(_ context: CGContext, rect: CGRect, radius: CGFloat, fill: CGColor, border: CGColor, lineWidth: CGFloat) {
  context.addPath(rounded(rect, radius: radius))
  context.setFillColor(fill)
  context.setStrokeColor(border)
  context.setLineWidth(lineWidth)
  context.drawPath(using: .fillStroke)
}

func line(_ context: CGContext, from: CGPoint, to: CGPoint, stroke: CGColor, width: CGFloat) {
  context.setStrokeColor(stroke)
  context.setLineWidth(width)
  context.setLineCap(.round)
  context.move(to: from)
  context.addLine(to: to)
  context.strokePath()
}

func image(size: Int, artSize: CGFloat, name: String, draw: (CGContext) -> Void) {
  let bitmap = NSBitmapImageRep(
    bitmapDataPlanes: nil, pixelsWide: size, pixelsHigh: size,
    bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true,
    isPlanar: false, colorSpaceName: .deviceRGB,
    bytesPerRow: 0, bitsPerPixel: 0
  )!
  let graphics = NSGraphicsContext(bitmapImageRep: bitmap)!
  let previous = NSGraphicsContext.current
  NSGraphicsContext.current = graphics
  let context = graphics.cgContext
  context.clear(CGRect(x: 0, y: 0, width: size, height: size))
  context.translateBy(x: 0, y: CGFloat(size))
  context.scaleBy(x: CGFloat(size) / artSize, y: -CGFloat(size) / artSize)
  context.setShouldAntialias(true)
  draw(context)
  graphics.flushGraphics()
  NSGraphicsContext.current = previous
  let data = bitmap.representation(using: .png, properties: [:])!
  try! data.write(to: directory.appendingPathComponent(name))
}

func drawColorIcon(_ context: CGContext) {
  context.addPath(rounded(CGRect(x: 0, y: 0, width: 80, height: 80), radius: 19))
  context.setFillColor(color(0x111820))
  context.fillPath()

  for angle in [-17.0, 17.0] {
    context.saveGState()
    context.translateBy(x: 40, y: 86)
    context.rotate(by: CGFloat(angle * .pi / 180))
    context.translateBy(x: -40, y: -86)
    card(context, rect: CGRect(x: angle < 0 ? 12 : 23, y: 15, width: 45, height: 53),
         radius: 8, fill: color(0x25354a), border: color(0x7b90a9), lineWidth: 2)
    context.restoreGState()
  }

  card(context, rect: CGRect(x: 18, y: 10, width: 44, height: 56),
       radius: 9, fill: color(0x1b2738), border: color(0xc6f46a), lineWidth: 2.5)
  for (end, y) in [(52.0, 27.0), (48.0, 36.0), (43.0, 45.0)] {
    line(context, from: CGPoint(x: 28, y: y), to: CGPoint(x: end, y: y),
         stroke: color(0xedf4ff), width: 3)
  }
  context.addEllipse(in: CGRect(x: 49, y: 51, width: 6, height: 6))
  context.setFillColor(color(0xc6f46a))
  context.fillPath()
}

func drawMonochromeIcon(_ context: CGContext) {
  let white = color(0xffffff)
  for angle in [-14.0, 14.0] {
    context.saveGState()
    context.translateBy(x: 32, y: 55)
    context.rotate(by: CGFloat(angle * .pi / 180))
    context.translateBy(x: -32, y: -55)
    context.addPath(rounded(CGRect(x: angle < 0 ? 9 : 24, y: 14, width: 31, height: 39), radius: 5))
    context.setStrokeColor(white)
    context.setLineWidth(3)
    context.strokePath()
    context.restoreGState()
  }
  let front = rounded(CGRect(x: 17, y: 10, width: 30, height: 42), radius: 5)
  context.addPath(front)
  context.setBlendMode(.clear)
  context.fillPath()
  context.setBlendMode(.normal)
  context.addPath(front)
  context.setStrokeColor(white)
  context.setLineWidth(3)
  context.strokePath()
  for (end, y) in [(40.0, 22.0), (37.0, 30.0), (34.0, 38.0)] {
    line(context, from: CGPoint(x: 24, y: y), to: CGPoint(x: end, y: y),
         stroke: white, width: 3)
  }
}

for size in [96, 180, 192, 512] {
  image(size: size, artSize: 80, name: "icon-\(size).png", draw: drawColorIcon)
}
image(size: 512, artSize: 64, name: "launcher-icon-512.png", draw: drawMonochromeIcon)
