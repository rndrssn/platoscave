'use strict';

(function renderKaTeXFormulas() {
  var katex = window.katex;
  if (!katex) return;
  document.querySelectorAll('[data-formula]').forEach(function(fig) {
    var output = document.createElement('div');
    try {
      katex.render(fig.getAttribute('data-formula'), output, {
        displayMode: true,
        throwOnError: false,
        output: 'htmlAndMathml'
      });
    } catch (e) {
      return;
    }
    fig.insertBefore(output, fig.firstChild);
  });
}());
