package petro

import (
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

type roundTripFunc func(*http.Request) (*http.Response, error)

func (fn roundTripFunc) RoundTrip(req *http.Request) (*http.Response, error) {
	return fn(req)
}

func TestOperatorSessionStatusDelegatesToTheConsole(t *testing.T) {
	previous := operatorAuthClient
	t.Cleanup(func() { operatorAuthClient = previous })

	operatorAuthClient = &http.Client{Transport: roundTripFunc(func(req *http.Request) (*http.Response, error) {
		if req.URL.String() != "http://127.0.0.1:8080/api/platform/v1/me" {
			t.Errorf("session check went to %s", req.URL)
		}
		if req.Host != "admin.petronet.mn" {
			t.Errorf("host gate received %q", req.Host)
		}
		if got := req.Header.Get("Cookie"); got != "nexus_cp_session=signed" {
			t.Errorf("console cookie = %q", got)
		}
		return &http.Response{
			StatusCode: http.StatusOK,
			Body:       io.NopCloser(strings.NewReader(`{"operator":{"role":"auditor"}}`)),
			Header:     make(http.Header),
		}, nil
	})}

	req := httptest.NewRequest(http.MethodGet, "https://admin.petronet.mn/api/platform/v1/petro/overview", nil)
	req.AddCookie(&http.Cookie{Name: "nexus_cp_session", Value: "signed"})
	if got := operatorSessionStatus(req); got != http.StatusOK {
		t.Fatalf("session status = %d", got)
	}
}
