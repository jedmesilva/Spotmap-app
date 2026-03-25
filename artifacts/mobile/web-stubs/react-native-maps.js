const React = require("react");
const { View, Text, StyleSheet } = require("react-native");

function MapView({ style, children }) {
  return React.createElement(
    View,
    {
      style: [style, { backgroundColor: "#050A14", alignItems: "center", justifyContent: "center" }],
    },
    React.createElement(Text, { style: { color: "#7EA8CC", fontFamily: "Inter_600SemiBold", fontSize: 16 } }, "SpotMap — Use o app mobile")
  );
}

MapView.Animated = MapView;

function Marker() { return null; }
function Circle() { return null; }
function Polyline() { return null; }
function Polygon() { return null; }
function Callout() { return null; }
function UrlTile() { return null; }

module.exports = MapView;
module.exports.default = MapView;
module.exports.Marker = Marker;
module.exports.Circle = Circle;
module.exports.Polyline = Polyline;
module.exports.Polygon = Polygon;
module.exports.Callout = Callout;
module.exports.UrlTile = UrlTile;
module.exports.MapView = MapView;
module.exports.PROVIDER_GOOGLE = "google";
module.exports.PROVIDER_DEFAULT = null;
