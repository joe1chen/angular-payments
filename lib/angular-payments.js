angular.module('angularPayments', []);angular.module('angularPayments')

.factory('Common', [function(){

  var ret = {};


  // expiry is a string "mm / yy[yy]"
  ret['parseExpiry'] = function(value){
    var month, prefix, year, _ref;

    value = value || ''

    value = value.replace(/\s/g, '');
    _ref = value.split('/', 2), month = _ref[0], year = _ref[1];

    if ((year != null ? year.length : void 0) === 2 && /^\d+$/.test(year)) {
      prefix = (new Date).getFullYear();
      prefix = prefix.toString().slice(0, 2);
      year = prefix + year;
    }

    month = parseInt(month, 10);
    year = parseInt(year, 10);
    
    return {
      month: month,
      year: year
    };
  };

  return ret;

}]);
;angular.module('angularPayments')

.factory('Cards', [function(){

  var defaultFormat = /(\d{1,4})/g;
  var defaultInputFormat =  /(?:^|\s)(\d{4})$/;

  var cards = [
    {
      type: 'samsconsumer',
      pattern: /^(604599)/,
      format: defaultFormat,
      inputFormat: defaultInputFormat,
      length: [16],
      cvcLength: [3],
      luhn: true
    },
    {
      type: 'samsbusiness',
      pattern: /^(604600)/,
      format: defaultFormat,
      inputFormat: defaultInputFormat,
      length: [16],
      cvcLength: [3],
      luhn: true
    },
    {
      type: 'maestro',
      pattern: /^(5018|5020|5038|6304|6759|676[1-3])/,
      format: defaultFormat,
      inputFormat: defaultInputFormat,
      length: [12, 13, 14, 15, 16, 17, 18, 19],
      cvcLength: [3],
      luhn: true
    }, {
      type: 'dinersclub',
      pattern: /^(36|38|30[0-5])/,
      format: defaultFormat,
      inputFormat: defaultInputFormat,
      length: [14],
      cvcLength: [3],
      luhn: true
    }, {
      type: 'laser',
      pattern: /^(6706|6771|6709)/,
      format: defaultFormat,
      inputFormat: defaultInputFormat,
      length: [16, 17, 18, 19],
      cvcLength: [3],
      luhn: true
    }, {
      type: 'jcb',
      pattern: /^35/,
      format: defaultFormat,
      inputFormat: defaultInputFormat,
      length: [16],
      cvcLength: [3],
      luhn: true
    }, {
      type: 'unionpay',
      pattern: /^62/,
      format: defaultFormat,
      inputFormat: defaultInputFormat,
      length: [16, 17, 18, 19],
      cvcLength: [3],
      luhn: false
    }, {
      type: 'discover',
      pattern: /^(6011|65|64[4-9]|622)/,
      format: defaultFormat,
      inputFormat: defaultInputFormat,
      length: [16],
      cvcLength: [3],
      luhn: true
    }, {
      type: 'mastercard',
      pattern: /^5[1-5]|^2(?:2(?:2[1-9]|[3-9]\d)|[3-6]\d\d|7(?:[01]\d|20))/,
      format: defaultFormat,
      inputFormat: defaultInputFormat,
      length: [16],
      cvcLength: [3],
      luhn: true
    }, {
      type: 'amex',
      pattern: /^3[47]/,
      format: /(\d{1,4})(\d{1,6})?(\d{1,5})?/,
      inputFormat: /^(\d{4}|\d{4}\s\d{6})$/,
      length: [15],
      cvcLength: [3, 4],
      luhn: true
    }, {
      type: 'visa',
      pattern: /^4/,
      format: defaultFormat,
      inputFormat: defaultInputFormat,
      length: [13, 14, 15, 16],
      cvcLength: [3],
      luhn: true
    }
  ];


  var _fromNumber = function(num){
      var card, i, len;

      num = (num + '').replace(/\D/g, '');

      for (i = 0, len = cards.length; i < len; i++) {

        card = cards[i];

        if (card.pattern.test(num)) {
          return card;
        }

      }
  };

  var _fromType = function(type) {
      var card, i, len;

      for (i = 0, len = cards.length; i < len; i++) {

        card = cards[i];

        if (card.type === type) {
          return card;
        }

      }
  };

  return {
      fromNumber: function(val) { return _fromNumber(val) },
      fromType: function(val) { return _fromType(val) },
      defaultFormat: function() { return defaultFormat;},
      defaultInputFormat: function() { return defaultInputFormat;}
  };

}]);
;angular.module('angularPayments')


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
;angular.module('angularPayments')



.factory('_Validate', ['Cards', 'Common', '$parse', function(Cards, Common, $parse){

  var __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; }

  var _luhnCheck = function(num) {
    var digit, digits, odd, sum, i, len;

    odd = true;
    sum = 0;
    digits = (num + '').split('').reverse();

    for (i = 0, len = digits.length; i < len; i++) {

      digit = digits[i];
      digit = parseInt(digit, 10);

      if ((odd = !odd)) {
        digit *= 2;
      }

      if (digit > 9) {
        digit -= 9;
      }

      sum += digit;

    }

    return sum % 10 === 0;
  };

  var _validators = {}

  _validators['cvc'] = function(cvc, ctrl, scope, attr){
      var ref, ref1;

      // valid if empty - let ng-required handle empty
      if(cvc == null || cvc.length == 0) return true;

      if (!/^\d+$/.test(cvc)) {
        return false;
      }

      var type;
      if(attr.paymentsTypeModel) {
          var typeModel = $parse(attr.paymentsTypeModel);
          type = typeModel(scope);
      }

      if (type) {
        return ref = cvc.length, __indexOf.call((ref1 = Cards.fromType(type)) != null ? ref1.cvcLength : void 0, ref) >= 0;
      } else {
        return cvc.length >= 3 && cvc.length <= 4;
      }
  }

  _validators['card'] = function(num, ctrl, scope, attr){
      var card, ref, typeModel;

      if(attr.paymentsTypeModel) {
          typeModel = $parse(attr.paymentsTypeModel);
      }

      var clearCard = function(){
          if(typeModel) {
              typeModel.assign(scope, null);
          }
          ctrl.$card = null;
      };

      // valid if empty - let ng-required handle empty
      if(num == null || num.length == 0){
        clearCard();
        return true;
      }

      num = (num + '').replace(/\s+|-/g, '');

      if (!/^\d+$/.test(num)) {
        clearCard();
        return false;
      }

      card = Cards.fromNumber(num);

      if(!card) {
        clearCard();
        return false;
      }

      ctrl.$card = angular.copy(card);

      if(typeModel) {
          typeModel.assign(scope, card.type);
      }

      ret = (ref = num.length, __indexOf.call(card.length, ref) >= 0) && (card.luhn === false || _luhnCheck(num));

      return ret;
  }

  _validators['expiry'] = function(val){
    // valid if empty - let ng-required handle empty
    if(val == null || val.length == 0) return true;

    obj = Common.parseExpiry(val);

    month = obj.month;
    year = obj.year;

    var currentTime, expiry, prefix;

    if (!(month && year)) {
      return false;
    }

    if (!/^\d+$/.test(month)) {
      return false;
    }

    if (!/^\d+$/.test(year)) {
      return false;
    }

    if (!(parseInt(month, 10) <= 12)) {
      return false;
    }

    if (year.length === 2) {
      prefix = (new Date).getFullYear();
      prefix = prefix.toString().slice(0, 2);
      year = prefix + year;
    }

    expiry = new Date(year, month);
    currentTime = new Date;
    expiry.setMonth(expiry.getMonth() - 1);
    expiry.setMonth(expiry.getMonth() + 1, 1);

    return expiry > currentTime;
  }

  return function(type, val, ctrl, scope, attr){
    if(!_validators[type]){

      types = Object.keys(_validators);

      errstr  = 'Unknown type for validation: "'+type+'". ';
      errstr += 'Should be one of: "'+types.join('", "')+'"';

      throw errstr;
    }
    return _validators[type](val, ctrl, scope, attr);
  }
}])


.factory('_ValidateWatch', ['_Validate', function(_Validate){

    var _validatorWatches = {}

    _validatorWatches['cvc'] = function(type, ctrl, scope, attr){
        if(attr.paymentsTypeModel) {
            scope.$watch(attr.paymentsTypeModel, function(newVal, oldVal) {
                if(newVal != oldVal) {
                    var valid = _Validate(type, ctrl.$modelValue, ctrl, scope, attr);
                    ctrl.$setValidity(type, valid);
                }
            });
        }
    }

    return function(type, ctrl, scope, attr){
        if(_validatorWatches[type]){
            return _validatorWatches[type](type, ctrl, scope, attr);
        }
    }
}])

.directive('paymentsValidate', ['$window', '_Validate', '_ValidateWatch', function($window, _Validate, _ValidateWatch){
  return {
    restrict: 'A',
    require: 'ngModel',
    link: function(scope, elem, attr, ctrl){

      var type = attr.paymentsValidate;

      _ValidateWatch(type, ctrl, scope, attr);

      var validateFn = function(val) {
          var valid = _Validate(type, val, ctrl, scope, attr);
          ctrl.$setValidity(type, valid);
          return valid ? val : undefined;
      };

      ctrl.$formatters.push(validateFn);
      ctrl.$parsers.push(validateFn);
    }
  }
}])
;angular.module('angularPayments')

.directive('stripeForm', ['$window', '$parse', 'Common', function($window, $parse, Common) {

  // directive intercepts form-submission, obtains Stripe's cardToken using stripe.js
  // and then passes that to callback provided in stripeForm, attribute.

  // data that is sent to stripe is filtered from scope, looking for valid values to
  // send and converting camelCase to snake_case, e.g expMonth -> exp_month


  // filter valid stripe-values from scope and convert them from camelCase to snake_case
  _getDataToSend = function(data){

    var possibleKeys = ['number', 'expMonth', 'expYear',
                    'cvc', 'name','addressLine1',
                    'addressLine2', 'addressCity',
                    'addressState', 'addressZip',
                    'addressCountry']

    var camelToSnake = function(str){
      return str.replace(/([A-Z])/g, function(m){
        return "_"+m.toLowerCase();
      });
    }

    var ret = {};

    for(i in possibleKeys){
        if(data.hasOwnProperty(possibleKeys[i])){
            ret[camelToSnake(possibleKeys[i])] = angular.copy(data[possibleKeys[i]]);
        }
    }

    ret['number'] = (ret['number'] || '').replace(/ /g,'');

    return ret;
  };

  return {
    restrict: 'A',
    link: function(scope, elem, attr) {

      if(!$window.Stripe){
          throw 'stripeForm requires that you have stripe.js installed. Include https://js.stripe.com/v2/ into your html.';
      }

      var form = angular.element(elem);

      form.bind('submit', function() {

        expMonthUsed = scope.expMonth ? true : false;
        expYearUsed = scope.expYear ? true : false;

        if(!(expMonthUsed && expYearUsed)){
          exp = Common.parseExpiry(scope.expiry)
          scope.expMonth = exp.month
          scope.expYear = exp.year
        }

        var button = form.find('button');
        button.prop('disabled', true);

        if(form.hasClass('ng-valid')) {


          $window.Stripe.createToken(_getDataToSend(scope), function() {
            var args = arguments;
            scope.$apply(function() {
              scope[attr.stripeForm].apply(scope, args);
            });
            button.prop('disabled', false);

          });

        } else {
          scope.$apply(function() {
            scope[attr.stripeForm].apply(scope, [400, {error: 'Invalid form submitted.'}]);
          });
          button.prop('disabled', false);
        }

        scope.expMonth = null;
        scope.expYear  = null;

      });
    }
  };
}]);
