package main

import (
	"flag"
	"fmt"
	"github.com/gin-gonic/gin"
	"io/ioutil"
	"net/http"
	"os"
)

var dataPath string

func main() {
	flag.StringVar(&dataPath, "dpath", "jsons/", "data path")
	flag.Parse()
	r := gin.Default()
	r.Use(Cors())
	r.GET("/adaptive/costgraph", HandleCostGraph)
	r.GET("/adaptive/info", HandleAdaptiveInfo)
	r.GET("/automatic/info", HandleAutomaticInfo)
	r.GET("/time", HandleTime)
	r.Run() // listen and serve on 0.0.0.0:8080 (for windows "localhost:8080")
}

func HandleCostGraph(c *gin.Context) {
	step_str := c.DefaultQuery("step", "0")
	alg := c.DefaultQuery("alg", "dfp")
	filepath := fmt.Sprintf(dataPath+"%s/step/step_%s.json", alg, step_str)
	file, err := os.Open(filepath)
	if err != nil {
		panic(err)
	}
	defer file.Close()
	content, err := ioutil.ReadAll(file)
	if err != nil {
		panic(err)
	}
	c.JSON(http.StatusOK, string(content))
}

func HandleAdaptiveInfo(c *gin.Context) {
	alg := c.DefaultQuery("alg", "dfp")
	basepath := fmt.Sprintf(dataPath+"%s/", alg)
	file, err := os.Open(basepath + "block.json")
	if err != nil {
		panic(err)
	}
	defer file.Close()
	blocks, err := ioutil.ReadAll(file)

	file, err = os.Open(basepath + "operator.json")
	defer file.Close()
	if err != nil {
		panic(err)
	}
	operators, err := ioutil.ReadAll(file)
	if err != nil {
		panic(err)
	}

	file, err = os.Open(basepath + "solution.json")
	defer file.Close()
	if err != nil {
		panic(err)
	}
	solution, err := ioutil.ReadAll(file)
	if err != nil {
		panic(err)
	}

	file, err = os.Open(basepath + "root.json")
	defer file.Close()
	if err != nil {
		panic(err)
	}
	root, err := ioutil.ReadAll(file)
	if err != nil {
		panic(err)
	}

	c.JSON(http.StatusOK, gin.H{"blocks": string(blocks), "operators": string(operators), "solution": string(solution), "root": string(root)})
}

func HandleAutomaticInfo(c *gin.Context) {
	alg := c.DefaultQuery("alg", "dfp")
	basepath := fmt.Sprintf(dataPath+"%s/", alg)

	file, err := os.Open(basepath + "block.json")
	defer file.Close()
	if err != nil {
		panic(err)
	}
	blocks, err := ioutil.ReadAll(file)

	file, err = os.Open(basepath + "operator.json")
	defer file.Close()
	if err != nil {
		panic(err)
	}
	operators, err := ioutil.ReadAll(file)
	if err != nil {
		panic(err)
	}

	file, err = os.Open(basepath + "hashtable.json")
	defer file.Close()
	if err != nil {
		panic(err)
	}
	hashTable, err := ioutil.ReadAll(file)
	if err != nil {
		panic(err)
	}
	c.JSON(http.StatusOK, gin.H{"blocks": string(blocks), "operators": string(operators), "hashTable": string(hashTable)})
}

func HandleTime(c *gin.Context) {
	filepath := dataPath + "times.txt"
	file, err := os.Open(filepath)
	if err != nil {
		panic(err)
	}
	defer file.Close()
	content, err := ioutil.ReadAll(file)
	c.JSON(http.StatusOK, string(content))
}

func Cors() gin.HandlerFunc {
	return func(c *gin.Context) {
		method := c.Request.Method
		// 可将将* 替换为指定的域名
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE, UPDATE")
		c.Header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization")
		c.Header("Access-Control-Expose-Headers", "Content-Length, Access-Control-Allow-Origin, Access-Control-Allow-Headers, Cache-Control, Content-Language, Content-Type")
		c.Header("Access-Control-Allow-Credentials", "true")
		if method == "OPTIONS" {
			c.AbortWithStatus(http.StatusNoContent)
		}
		c.Next()
	}
}
