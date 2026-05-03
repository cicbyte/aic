package auth

import (
	"encoding/json"
	"os"
	"path/filepath"
	"sync"

	"golang.org/x/net/context"

	api "github.com/cicbyte/aic/api/v1/auth"
	service "github.com/cicbyte/aic/internal/service"
	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/os/gfile"
	"github.com/gogf/gf/v2/util/guid"
)

func init() {
	service.RegisterAuth(New())
}

func New() *sAuth {
	return &sAuth{}
}

type sAuth struct {
	// Token 存储（运行时）
	token     string
	tokenMutex sync.RWMutex
}

// generateToken 生成随机 token
func generateToken() string {
	return guid.S()
}

// maskToken 脱敏显示 token（前8位...后4位）
func maskToken(t string) string {
	if len(t) <= 12 {
		return "****"
	}
	return t[:8] + "..." + t[len(t)-4:]
}

// getAuthFile 获取认证配置文件路径
func (s *sAuth) getAuthFile() string {
	configDir := gfile.Temp("aic")
	if !gfile.Exists(configDir) {
		gfile.Mkdir(configDir)
	}
	return filepath.Join(configDir, "auth.json")
}

// saveTokenToFile 保存 token 到认证配置文件
func (s *sAuth) saveTokenToFile(tok string) error {
	authFile := s.getAuthFile()

	authData := map[string]string{"token": tok}
	newData, err := json.MarshalIndent(authData, "", "  ")
	if err != nil {
		return err
	}

	return os.WriteFile(authFile, newData, 0600)
}

// loadTokenFromFile 从认证配置文件加载 token
func (s *sAuth) loadTokenFromFile() string {
	authFile := s.getAuthFile()

	data, err := os.ReadFile(authFile)
	if err != nil {
		return ""
	}

	var authData struct {
		Token string `json:"token"`
	}

	if err := json.Unmarshal(data, &authData); err != nil {
		return ""
	}

	return authData.Token
}

// InitializeToken 初始化 token（优先级：文件 > 随机生成）
func (s *sAuth) InitializeToken() string {
	s.tokenMutex.Lock()
	defer s.tokenMutex.Unlock()

	// 尝试从文件加载
	savedToken := s.loadTokenFromFile()
	if savedToken != "" {
		s.token = savedToken
		g.Log().Infof(context.Background(), "使用已保存的 Token: %s", maskToken(s.token))
		return s.token
	}

	// 生成新的 token
	s.token = generateToken()
	if err := s.saveTokenToFile(s.token); err != nil {
		g.Log().Errorf(context.Background(), "保存 token 到文件失败: %v", err)
	}

	g.Log().Infof(context.Background(), "生成新的 Token: %s", maskToken(s.token))
	return s.token
}

// GetToken 获取当前 token
func (s *sAuth) GetToken() string {
	s.tokenMutex.RLock()
	defer s.tokenMutex.RUnlock()
	return s.token
}

// ValidateToken 验证 token 是否有效
func (s *sAuth) ValidateToken(token string) bool {
	s.tokenMutex.RLock()
	defer s.tokenMutex.RUnlock()
	return s.token != "" && s.token == token
}

// Login Token验证
func (s *sAuth) Login(ctx context.Context, req *api.AuthLoginReq) (res *api.AuthLoginRes, err error) {
	res = new(api.AuthLoginRes)

	if req.Token == "" {
		return nil, gerror.New("请输入访问令牌")
	}

	// 验证 token
	if !s.ValidateToken(req.Token) {
		return nil, gerror.New("访问令牌无效")
	}

	res.Token = maskToken(req.Token)
	g.Log().Infof(ctx, "Token验证成功")
	return
}

// GetTokenInfo 获取当前 Token 信息
func (s *sAuth) GetTokenInfo(ctx context.Context, req *api.AuthGetTokenReq) (res *api.AuthGetTokenRes, err error) {
	res = new(api.AuthGetTokenRes)
	res.Token = maskToken(s.GetToken())
	return
}

// UpdateToken 更新 Token
func (s *sAuth) UpdateToken(ctx context.Context, req *api.AuthUpdateTokenReq) (res *api.AuthUpdateTokenRes, err error) {
	res = new(api.AuthUpdateTokenRes)

	var newToken string
	if req.Regenerate {
		newToken = generateToken()
	} else if req.Token != "" {
		if len(req.Token) < 12 {
			return nil, gerror.New("Token 长度不能少于12位")
		}
		newToken = req.Token
	} else {
		return nil, gerror.New("请提供 token 或设置 regenerate 为 true")
	}

	// 更新内存中的 token
	s.tokenMutex.Lock()
	s.token = newToken
	s.tokenMutex.Unlock()

	// 持久化到文件
	if err := s.saveTokenToFile(newToken); err != nil {
		g.Log().Errorf(ctx, "保存 token 到文件失败: %v", err)
		return nil, gerror.New("保存 token 失败")
	}

	res.Token = newToken
	g.Log().Infof(ctx, "Token 已更新: %s", maskToken(newToken))
	return
}
