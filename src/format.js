angular.module('angularPayments')


.factory('_Format',['Cards', 'Common', '$filter', function(Cards, Common, $filter){

  var _formats = {}

  var _hasTextSelected = function($target) {
    var ref;

    if (($target.prop('selectionStart') != null) && $target.prop('selectionStart') !== $target.prop('selectionEnd')) {
        return true;
    }

    if (typeof document !== "undefined" && document !== null ? (ref = document.selection) != null ? typeof ref.createRange === "function" ? ref.createRange().text : void 0 : void 0 : void 0) {
        return true;
    }

    return false;
  };

  // card formatting

  var _formatCardNumber = function(e) {
    var $target, card, length, re, upperLength, value, originalValue;

    $target = angular.element(e.currentTarget);
    $target.val($target.val().replace(/[^0-9 ]+/g, ''));

    value = $target.val();

    card = Cards.fromNumber(value);
    length = (value.replace(/\D/g, '')).length;

    upperLength = 16;

    if (card) {
      upperLength = card.length[card.length.length - 1];
    }

    // restrict card length
    if (length >= upperLength) {
      var amountToTrim = upperLength - length;
      if (amountToTrim) {
        $target.val(value.slice(0, amountToTrim));
      }
    }

    if (($target.prop('selectionStart') != null) && $target.prop('selectionStart') !== value.length) {
      return;
    }

    re = Cards.defaultInputFormat();
    if (card) {
        re = card.inputFormat;
    }

    if (re.test(value)) {
      return $target.val(value + ' ');
    }
  };

  // prevent more than 16 digits being entered
  var _restrictCardNumber = function(e) {
    var $target, card, value;

    $target = angular.element(e.currentTarget);
    value = $target.val().replace(/[^0-9]+/g, '');

    if (e.which === 8 || e.which === 9 || _hasTextSelected($target)) {
      return;
    }

    card = Cards.fromNumber(value);

    if (card) {
      if(value.length >= card.length[card.length.length - 1]) {
        e.preventDefault();
      }
    }
    else if(value.length >= 16) {
      e.preventDefault();
    }
  };

  var _formatBackCardNumber = function(e) {
    var $target, value;

    $target = angular.element(e.currentTarget);
    value = $target.val().replace(/[^0-9 ]+/g, '');

    if(e.meta || e.which !== 8) {
      return;
    }

    if(/\d\s$/.test(value) && !e.meta) {
      e.preventDefault();
      return $target.val(value.replace(/\d\s$/, ''));
    } else if (/\s\d?$/.test(value)) {
      e.preventDefault();
      return $target.val(value.replace(/\s\d?$/, ''));
    }
  };


  var _getFormattedCardNumber = function(num) {
    var card, groups, upperLength, ref;

    card = Cards.fromNumber(num);

    if (!card) {
      return num;
    }

    upperLength = card.length[card.length.length - 1];
    num = num.replace(/\D/g, '');
    num = num.slice(0, +upperLength + 1 || 9e9);

    if(card.format.global) {
      return (ref = num.match(card.format)) != null ? ref.join(' ') : void 0;
    } else {
      groups = card.format.exec(num);

      if (groups != null) {
        groups.shift();
      }

      return groups != null ? groups.join(' ') : void 0;
    }
  };

  var _reFormatCardNumber = function(e) {
    return setTimeout(function() {
      var $target, value;
      $target = angular.element(e.target);

      value = $target.val();
      value = _getFormattedCardNumber(value);
      return $target.val(value);
    });
  };

  var _parseCardNumber = function(value) {
    return value != null ? value.replace(/\s/g, '') : value;
  };

  _formats['card'] = function(elem, ctrl){
    elem.bind('keydown', _restrictCardNumber);
    elem.bind('keydown', _formatBackCardNumber);
    elem.bind('input', _formatCardNumber);
    elem.bind('paste', _reFormatCardNumber);

    ctrl.$parsers.push(_parseCardNumber);
    ctrl.$formatters.push(_getFormattedCardNumber);
  };


  // cvc

  var _formatCVC = function(e){
    $target = angular.element(e.currentTarget);
    $target.val($target.val().replace(/[^0-9]+/g,'').substring(0,4));
  };

  var _restrictCVC = function(e) {
    var $target, value;

    $target = angular.element(e.currentTarget);
    value = $target.val().replace(/[^0-9]+/g, '');

    // delete or tab keys
    if (e.which === 8 || e.which === 9) {
      return;
    }

    if (value.length >= 4) {
      e.preventDefault();
      return;
    }
  };

  _formats['cvc'] = function(elem){
    elem.bind('keydown', _restrictCVC);
    elem.bind('input', _formatCVC);
  };

  // expiry
    var _formatExpirationDate = function(value) {
      if (/^\d$/.test(value) && (value !== '0' && value !== '1')) {
        return "0" + value + " / ";
      } else if (value.length > 1){
        return value.substring(0,2) + " / " + value.substring(2,6);
      }
      else {
        return value;
      }
    };

    var _formatExpiry = function(e) {
      var $target, value;

      $target = angular.element(e.currentTarget);
      $target.val($target.val().replace(/[^0-9]+/g, ''));

      value = $target.val().slice(0,6);

      var newValue = _formatExpirationDate(value);
      if (newValue) {
        return $target.val(newValue);
      }
    };


    // allow for backspace to remove digits before change is triggered
    var _formatBackExpiry = function(e) {
      var $target, value;

      $target = angular.element(e.currentTarget);
      value = $target.val().replace(/[^0-9]+/g, '');

      if(e.meta || e.which !== 8) {
        return;
      }

      e.preventDefault();
      var newValue = _formatExpirationDate(value.substring(0, value.length - 1));
      return $target.val(newValue);
    };

    // prevent more than 6 digits from being entered
    var _restrictExpiry = function(e) {
      var $target, value;

      $target = angular.element(e.currentTarget);
      value = $target.val().replace(/[^0-9]+/g, '');

      // delete or tab keys
      if (e.which === 8 || e.which === 9) {
        return;
      }

      if (value.length >= 6) {
        e.preventDefault();
        return;
      }
    };

    var _parseExpiry = function(value) {
      if(value != null) {
        var obj = Common.parseExpiry(value);
        var expiry = new Date(obj.year, obj.month-1);
        return $filter('date')(expiry, 'MM/yyyy');
      }
      return null;
    };

    var _getFormattedExpiry = function(value) {
      if(value != null) {
        var obj = Common.parseExpiry(value);
        var expiry = new Date(obj.year, obj.month-1);
        return $filter('date')(expiry, 'MM / yyyy');
      }
      return null;
    };


    _formats['expiry'] = function(elem, ctrl){
        elem.bind('keydown', _restrictExpiry);
        elem.bind('keydown', _formatBackExpiry);
        elem.bind('input', _formatExpiry);
        ctrl.$parsers.push(_parseExpiry);
        ctrl.$formatters.push(_getFormattedExpiry);
    };

  return function(type, elem, ctrl){
    if(!_formats[type]){

      types = Object.keys(_formats);

      errstr  = 'Unknown type for formatting: "'+type+'". ';
      errstr += 'Should be one of: "'+types.join('", "')+'"';

      throw errstr;
    }
    return _formats[type](elem, ctrl);
  };

}])

.directive('paymentsFormat', ['$window', '_Format', function($window, _Format){
    return {
      restrict: 'A',
      require: 'ngModel',
      link: function(scope, elem, attr, ctrl){
        _Format(attr.paymentsFormat, elem, ctrl);
      }
    };
}]);
