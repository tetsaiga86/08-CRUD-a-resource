(function(module) {
  function Article (opts) {
    /* DONE: Convert property assignment to Functional Programming style.
        Now, ALL properties of `opts` will be assigned as properies of the
        newly created article object. */
    Object.keys(opts).forEach(function(prop, index, keys) {
      this[prop] = opts[prop];
    },this); // Specify that 'this' is to be bound to the constructor instance.
  }

  Article.all = [];

  Article.prototype.toHtml = function(scriptTemplateId) {
    var template = Handlebars.compile(scriptTemplateId.text());

    this.daysAgo = parseInt((new Date() - new Date(this.publishedOn)) / 60 / 60 / 24 / 1000);
    this.publishStatus = this.publishedOn ? 'published ' + this.daysAgo + ' days ago' : '(draft)';
    this.body = marked(this.body);

    return template(this);
  };

  // TODO: Set up a DB table for articles.
  Article.createTable = function(callback) {
    webDB.execute(
      'CREATE TABLE articleTable (Title text, Category text, author text, authorUrl text, publishedOn integer, body text);', // what SQL command do we run here inside these quotes?
      function(result) {
        console.log('Successfully set up the articles table.', result);
        if (callback) callback();
      }
    );
  };

  // DONE: Refactor to expect the data from the database, rather than localStorage.
  Article.loadAll = function(rows) {
    Article.all = rows.map(function(ele) {
      return new Article(ele);
    });
  };

  Article.fetchAll = function(next) {
    /* TODO: Refactor the .fetchAll() method to check
        if the database holds any records or not.

      If the DB has data already, we'll load up the data
        (most recent article first!), and then hand off control to the View.

      If the DB is empty, we need to retrieve the JSON and process it. */
    webDB.execute('Select * FROM articleTable;', function(rows) { // TODO: fill these quotes to 'select' our table.
      if (rows.length) {
        Article.loadAll(rows);
        next();
        /* TODO:
           1 - Use Article.loadAll to instanitate these rows,
           2 - Pass control to the view by calling the next function that
                was passed in to Article.fetchAll */

      } else {
        $.getJSON('/data/hackerIpsum.json', function(data) {
          // Save each article from this JSON file, so we don't need to request it next time:
          data.forEach(function(obj) {
            var article = new Article(obj); // This will instantiate an article instance based on each article object from our JSON.
            /* TODO:
               1 - 'insert' the newly-instantiated article in the DB:
                (hint: what can we call on each 'article' instance?). */
            article.insertRecord();
          });
          // Now get ALL the records out the DB, with their database IDs:
          webDB.execute('SELECT articleTable', function(rows) { // TODO: select our now full table
            // TODO:
            // 1 - Use Article.loadAll to instanitate these rows,
            // 2 - Pass control to the view by calling the next function that was passed in to Article.fetchAll
            Article.loadAll(rows);
            next();
          });
        });
      }
    });
  };

  Article.prototype.insertRecord = function(callback) {
    webDB.execute(
      [
        {
          // TODO: Insert an article instance into the database:
          // Note: this method will be called elsewhere after we retrieve our JSON
          'sql': 'INSERT INTO articleTable Where Title=?, Category=?, author=?, authorUrl=?, publishedOn=?, body=?;',
          'data': [this.title, this.author, this.authorUrl, this.category, this.publishedOn, this.body]
        }
      ],
      callback
    );
  };

  Article.prototype.updateRecord = function(callback) {
    webDB.execute(
      [
        {
          /* TODO: Update an article instance, overwriting
              its properties into the corresponding record in the database: */
          /* Note: this is an advanced admin option, so you will need to test
              out an individual query in the SQL console */
          'sql': 'UPDATE INTO articleTable Where Title=?, Category=?, author=?, authorUrl=?, publishedOn=?, body=?;',
          'data': [this.title, this.author, this.authorUrl, this.category, this.publishedOn, this.body, this.id]
        }
      ],
      callback
    );
  };

  Article.prototype.deleteRecord = function(callback) {
    webDB.execute(
      [
        {
          // TODO: Delete an article instance from the database based on its id:
          /* Note: this is an advanced admin option, so you will need to test
              out an individual query in the SQL console */
          'sql': '...;',
          'data': [this.id]
        }
      ],
      callback
    );
  };

  Article.truncateTable = function(callback) {
    webDB.execute(
      // TODO: Use correct SQL syntax to delete all records from the articles table.
      'DELETE ...;', // <----finish the command here, inside the quotes.
      callback
    );
  };

  Article.allAuthors = function() {
    return Article.all.map(function(article) {
      return article.author;
    })
    .reduce(function(names, name) {
      if (names.indexOf(name) === -1) {
        names.push(name);
      }
      return names;
    }, []);
  };

  Article.numWordsAll = function() {
    return Article.all.map(function(article) {
      return article.body.match(/\b\w+/g).length;
    })
    .reduce(function(a, b) {
      return a + b;
    });
  };

  Article.numWordsByAuthor = function() {
    return Article.allAuthors().map(function(author) {
      return {
        name: author,
        numWords: Article.all.filter(function(a) {
          return a.author === author;
        })
        .map(function(a) {
          return a.body.match(/\b\w+/g).length;
        })
        .reduce(function(a, b) {
          return a + b;
        })
      };
    });
  };

  Article.stats = function() {
    return {
      numArticles: Article.all.length,
      numWords: Article.numwords(),
      Authors: Article.allAuthors(),
    };
  };

  module.Article = Article;
})(window);
