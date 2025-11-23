package config

import (
	"log"
	"strings"

	"github.com/spf13/viper"
)

type Config struct {
	Env     string        `mapstructure:"env"`
	Catalog ServiceConfig `mapstructure:"catalog"`
	Library ServiceConfig `mapstructure:"library"`
	Media   ServiceConfig `mapstructure:"media"`
	History ServiceConfig `mapstructure:"history"`
	Minio   MinioConfig   `mapstructure:"minio"`
}

type MinioConfig struct {
	Endpoint  string             `mapstructure:"endpoint"`
	AccessKey string             `mapstructure:"access_key"`
	SecretKey string             `mapstructure:"secret_key"`
	Buckets   MinioBucketsConfig `mapstructure:"buckets"`
	UseSSL    bool               `mapstructure:"use_ssl"`
}

type MinioBucketsConfig struct {
	Audio  string `mapstructure:"audio"`
	Images string `mapstructure:"images"`
	Public string `mapstructure:"public"`
}

type ServiceConfig struct {
	HTTP HTTPServer `mapstructure:"http"`
	DB   DBConfig   `mapstructure:"db"`
}

type HTTPServer struct {
	Port string `mapstructure:"port"`
}

type DBConfig struct {
	DSN string `mapstructure:"dsn"`
}

func Load(configPath string) (*Config, error) {
	v := viper.New()

	// 1. Defaults
	v.SetDefault("env", "local")

	// 2. File
	v.AddConfigPath(configPath)
	v.SetConfigName("config")
	v.SetConfigType("yaml")

	if err := v.ReadInConfig(); err != nil {
		log.Printf("Config file not found, using defaults/env: %v", err)
	}

	// 3. Environment Variables
	// Viper автоматически матчит ENV переменные с ключами конфига.
	// APP_CATALOG_DB_DSN -> catalog.db.dsn
	v.SetEnvPrefix("APP")
	v.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))
	v.AutomaticEnv()

	var cfg Config
	if err := v.Unmarshal(&cfg); err != nil {
		return nil, err
	}

	return &cfg, nil
}
