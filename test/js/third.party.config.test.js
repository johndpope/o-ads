(function (window, document, $, undefined) {
    function runTests() {
        module('Third party config', {
            setup: function () {
                FT.ads.config.clear();
            }
        });

        test('Config get/set', function () {
            var result, obj,
                key = 'key',
                invalid = 'invalid',
                value = 'value',
                value2 = 'value2';

            expect(10);

            ok(FT.ads.config.set, 'The set method exists');
            ok(FT.ads.config.get, 'The get method exists');

            result = FT.ads.config.set();
            deepEqual(result, undefined, 'set without params returns undefined.');

            result = FT.ads.config.set(key);
            deepEqual(result, undefined, 'running set without a value returns undefined.');

            result = FT.ads.config.set(key, value);
            deepEqual(result, value, 'set with a key and value returns the value.');

            result = FT.ads.config.get();
            obj = {};
            obj[key] = value;
            deepEqual(result, obj, 'get without params returns all config.');

            result = FT.ads.config.get(key);
            deepEqual(result, value, 'get with a valid key returns the value.');

            result = FT.ads.config.get(invalid);
            deepEqual(result, undefined, 'get with an invalid key returns the undefined.');

            result = FT.ads.config.set(key, value2);
            deepEqual(result, value2, 'set an existing key returns the new value.');

            result = FT.ads.config.get(key);
            deepEqual(result, value2, 'get returns the new value.');
        });

        test('Config clear', function () {
            FT.ads.config.store = {
                some: 'data',
                more: 'data'
            };

            FT.ads.config.clear();
            expect(3);

            deepEqual(FT.ads.config.store, {}, 'the store is an empty object');
            deepEqual(FT.ads.config.get(), {}, 'get returns an empty object');
            deepEqual(FT.ads.config.get('some'), undefined, 'get a previously set value returns undefined');
        });

        test('Config fetchMetaConfig', function () {

           expect(1);

            // add a couple of meta tags to the page
            var meta1 = $('<meta name="metaParam1" content="metaValue1">').appendTo('head'),
                meta2 = $('<meta name="metaParam2" content="metaValue2">').appendTo('head'),
                result = FT.ads.config.fetchMetaConfig(),
                expected = {
                    metaParam1: 'metaValue1',
                    metaParam2: 'metaValue2'
                };

            deepEqual(result, expected, 'return an object of meta values.');

            meta1.remove();
            meta2.remove();
         });

        test('Config fetchGlobalConfig', function () {

           expect(1);

            FT.env = {
                envParam1: 'envValue1',
                envParam2: 'envValue2'
            };

            var result = FT.ads.config.fetchGlobalConfig(),
                expected = {
                    envParam1: 'envValue1',
                    envParam2: 'envValue2'
                };

            deepEqual(result, expected, 'return an object of global values.');
        });

        test('Config init', function () {

            FT.env = {
                envParam1: 'envValue1',
                envParam2: 'envValue2',
                overlapParam: 'envValue3'
            };

            var meta1 = $('<meta name="metaParam1" content="metaValue1">').appendTo('head'),
                meta2 = $('<meta name="metaParam2" content="metaValue2">').appendTo('head'),
                meta3 = $('<meta name="overlapParam" content="metaValue3">').appendTo('head'),
                result = FT.ads.config.init(),
                expected = {
                    metaParam1: 'metaValue1',
                    metaParam2: 'metaValue2',
                    envParam1: 'envValue1',
                    envParam2: 'envValue2',
                    overlapParam: 'envValue3',
                    formats:  {
                        banlb: [[728,90], [468,60], [970,90]],
                        mpu: [[300,250],[336,280]],
                        doublet: [[342,200]],
                        hlfmpu: [[300,600],[336,850],[300,250],[336,280]],
                        intro: [[1,1]],
                        newssubs: [[239,90]],
                        refresh: [[1,1]],
                        searchbox: [[200,28]],
                        tlbxrib: [[336,60]]
                    }
                };

            expect(5);

            deepEqual(FT.ads.config.store, expected, 'the store is now populated with meta and global values');
            deepEqual(FT.ads.config.get(), expected, 'get a returns all expected values');
            deepEqual(FT.ads.config.get('metaParam1'), 'metaValue1', 'get a meta value');
            deepEqual(FT.ads.config.get('envParam1'), 'envValue1', 'get a global value');
            deepEqual(FT.ads.config.get('overlapParam'), 'envValue3', 'global values override meta values');

            meta1.remove();
            meta2.remove();
            meta3.remove();
        });
    }

    $(runTests);
}(window, document, jQuery));
