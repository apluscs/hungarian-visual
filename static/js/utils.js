function resize(arr, newSize, defaultValue) {
  while (newSize > arr.length)
    arr.push(defaultValue);
}

function resize2D(arr, newH, newW, defaultValue) {
  console.log(newH, newW);
  for (i = 0; i < newH; ++i) {
    if (arr.length <= i) arr.push([]);
    resize(arr[i], newW, defaultValue);
  }
}

function setAttributes(el, attrs) {
  for (var key in attrs) {
    el.setAttribute(key, attrs[key]);
  }
}