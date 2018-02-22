import alight from 'alight'


alight.directives.al.copy = function (scope, element, expression, env) {
  $(element).on('click', function (event) {
    event.preventDefault()
    event.stopPropagation()

    try {
      // современный объект Selection
      window.getSelection().removeAllRanges()
    }
    catch (e) {
      // для IE8-
      document.selection.empty()
    }

    if (document.selection) {
      const range = document.body.createTextRange()
      range.moveToElementText(this)
      range.select().createTextRange()
      document.execCommand("Copy")
    }
    else if (window.getSelection) {
      const range = document.createRange()
      range.selectNode(this)
      console.log(range)
      window.getSelection().addRange(range)
      document.execCommand("Copy")
      alert("text copied")
    }
  })
}
